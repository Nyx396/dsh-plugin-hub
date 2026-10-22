import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHarness, artifactsDir } from './real-runtime.mjs';

const fixture = `
import '/assets/seeds.js';
import '/renderer.js';
import '/client.js';
try {
  const seeds = globalThis.__hubSeeds;
  const React = seeds.react;
  const h = React.createElement;
  const ctx = new seeds['@deepseek-ai/cordis'].Context();
  const renderer = __hubFactories.get('@deepseek-ai/dsh-client-ui-renderer')(id => seeds[id]);
  const plugin = __hubFactories.get('dsh-plugin-hub')(id => seeds[id]);
  renderer.apply(ctx);
  ctx.slots.installScope('session', { current: {getSnapshot: () => undefined, subscribe: () => () => {}} });
  document.documentElement.style.cssText='--dsw-alias-label-primary:#242427;--dsw-alias-label-secondary:#62626b;--dsw-alias-border-l2:#d9d9df;--dsw-alias-bg-layer-2:#fff;--dsw-alias-interactive-bg-hover-solid:#00000008;--dsw-alias-brand-primary:#6559c7';
  globalThis.__saved = [];
  globalThis.__actionCalls = [];
  const subscribe = listener => ctx.slots.subscribe('settings.section', listener);
  const version = () => ctx.slots.getVersion('settings.section');
  function App({ renderSlot }) {
    React.useSyncExternalStore(subscribe, version, version);
    const [active, setActive] = React.useState('plugin-hub');
    const [sessionId, setSession] = React.useState('session-a');
    globalThis.__setActive = setActive;
    globalThis.__setSession = setSession;
    const rows = ctx.slots.entries('settings.section').slice().sort((a,b)=>(a.options.order||0)-(b.options.order||0));
    return h('main', null,
      h('div',{id:'fixture-composer'}, renderSlot('conversation.input.left',{sessionId,session:{sessionId}}),h('span',null,'DSH composer fixture · '+sessionId)),
      h('div',{id:'fixture-settings'},
        h('nav',{id:'fixture-nav'},rows.map(row=>h('button',{key:row.options.id,'data-native-nav':row.options.id,onClick:()=>setActive(row.options.id)},typeof row.options.label==='function'?row.options.label():row.options.label))),
        h('div',{id:'fixture-content'},renderSlot('settings.section',{close:()=>setActive('general')},{only:active}))));
  }
  ctx.slots.register({name:'root',children:{'settings.section':{kind:'list',scope:'root'},'conversation.input.left':{kind:'list',scope:'root'}}},App);
  for (const [id,label,order] of [['general','通用',0],['oauth','OAuth / 订阅',10],['token-usage','Token 用量',13],['plugins','内置插件',20]]) {
    ctx.slots.register({name:'settings.section',id,label,order},()=>h('div',{'data-native-panel':id},label));
  }
  function makePanel(id,label) {
    return function NativePanel() {
      const [value,setValue]=React.useState(true);
      return h('section',{className:'test-native-panel','data-native-panel':id},
        h('h3',null,label+'原设置面板'),
        h('label',null,h('input',{type:'checkbox',checked:value,onChange:e=>{setValue(e.target.checked);__saved.push({id,value:e.target.checked});}}),'启用'+label),
        h('p',{className:'test-status'},'原组件、原保存回调，作为插件配置子面板渲染。'));
    };
  }
  globalThis.__nativeDisposers = new Map();
  globalThis.__nativeComponents = new Map();
  globalThis.__registerLegacy = id => {
    const label=id==='startup-screen'?'启动动画':'聊天背景';
    const component=makePanel(id,label);
    __nativeComponents.set(id,component);
    const remove=ctx.slots.register({name:'settings.section',id,label,order:id==='startup-screen'?26:27},component);
    __nativeDisposers.set(id,remove);
  };
  __registerLegacy('startup-screen');
  __registerLegacy('chat-wallpaper');
  globalThis.__originalEntries = ctx.slots.entries;
  globalThis.__originalEntriesDescriptor = Object.getOwnPropertyDescriptor(ctx.slots,'entries');
  globalThis.__hubFiber = ctx.plugin(plugin);
  await new Promise(resolve=>setTimeout(resolve,25));
  globalThis.__ctx = ctx;
  globalThis.__plugin = plugin;
  ctx.uiRenderer.mount(document.getElementById('root'));
  globalThis.__hubFixtureReady = true;
} catch (error) { globalThis.__hubFixtureError = error.stack || String(error); }
`;

test('real DSH renderer: grouped settings, search, pocket actions, lifecycle', { timeout: 60000 }, async () => {
  const browser = await createHarness(fixture);
  const { evaluate: ev, sleep } = browser;
  const originalEntriesOwn = await ev('__originalEntriesDescriptor !== undefined');
  const checks = [];
  const check = (label, actual, expected) => { assert.deepEqual(actual, expected, label); checks.push(label); };
  const settle = () => sleep(60);
  const nav = () => ev("[...document.querySelectorAll('[data-native-nav]')].map(e=>e.dataset.nativeNav)");
  const click = async selector => { await ev(`document.querySelector(${JSON.stringify(selector)}).click()`); await settle(); };
  const typeSearch = async text => {
    await ev(`(()=>{const input=document.querySelector('input[aria-label="搜索插件配置"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(text)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await settle();
  };
  try {
    await settle();
    check('only the two selected legacy sections leave the sidebar', await nav(), ['general', 'oauth', 'token-usage', 'plugins', 'plugin-hub']);
    check('both original panels appear in searchable hub', await ev("[...document.querySelectorAll('[data-plugin-hub-item]')].map(e=>e.dataset.pluginHubItem)"), ['startup-screen', 'chat-wallpaper']);
    check('legacy component functions are reused exactly', await ev("__ctx.slots.entries('plugin-hub.settings').every(e=>e.component===__nativeComponents.get(e.options.id))"), true);
    check('glyph is SVG rather than a font character', await ev("!!document.querySelector('[data-plugin-hub-pocket] svg rect') && !!document.querySelector('[data-plugin-hub-pocket] svg path')"), true);
    await browser.screenshot('settings-light');

    await typeSearch('wallpaper');
    check('English keywords locate Chinese settings', await ev("[...document.querySelectorAll('[data-plugin-hub-item]')].map(e=>e.dataset.pluginHubItem)"), ['chat-wallpaper']);
    await click('[data-plugin-hub-item="chat-wallpaper"]');
    check('original child panel renders with real slot ownership', await ev("!!document.querySelector('[data-plugin-hub-panel=" + '"chat-wallpaper"' + "] [data-native-panel=" + '"chat-wallpaper"' + "]')"), true);
    await click('[data-native-panel="chat-wallpaper"] input');
    check('original save callback remains wired', await ev('__saved'), [{ id: 'chat-wallpaper', value: false }]);
    await click('.dph-back');
    check('return retains search and restores its focus', await ev("({query:document.querySelector('input[aria-label=" + '"搜索插件配置"' + "]').value,focus:document.activeElement.getAttribute('aria-label')})"), { query: 'wallpaper', focus: '搜索插件配置' });
    await typeSearch('不存在的扩展');
    check('search exposes clear empty state', await ev("document.querySelector('.dph-empty')?.textContent.includes('没有找到')"), true);
    await click('[aria-label="清空插件搜索"]');

    await ev("__nativeDisposers.get('chat-wallpaper')()");
    await settle();
    check('unloaded original panel withdraws its hub entry', await ev("[...document.querySelectorAll('[data-plugin-hub-item]')].map(e=>e.dataset.pluginHubItem)"), ['startup-screen']);
    await ev("__registerLegacy('chat-wallpaper')");
    await settle();
    check('late registration is grouped again', await nav(), ['general', 'oauth', 'token-usage', 'plugins', 'plugin-hub']);
    check('late registration appears without reload', await ev("[...document.querySelectorAll('[data-plugin-hub-item]')].map(e=>e.dataset.pluginHubItem)"), ['startup-screen', 'chat-wallpaper']);
    await ev(`__nativeDisposers.get('chat-wallpaper')();globalThis.__changedLegacy=__ctx.slots.register({name:'settings.section',id:'chat-wallpaper',label:'聊天背景',order:27,inject:()=>({extra:true})},__nativeComponents.get('chat-wallpaper'))`);
    await settle();
    check('an incompatible future original panel remains available in native sidebar', await nav(), ['general', 'oauth', 'token-usage', 'plugins', 'plugin-hub', 'chat-wallpaper']);
    check('an incompatible panel is not duplicated in the hub', await ev("[...document.querySelectorAll('[data-plugin-hub-item]')].map(e=>e.dataset.pluginHubItem)"), ['startup-screen']);
    await ev("__changedLegacy();__registerLegacy('chat-wallpaper')");
    await settle();

    await ev(`globalThis.__futureDispose=__ctx.pluginHub.registerSettings({id:'future-reader',label:'视频读取',description:'抽帧选项',keywords:['media','gif'],order:40},()=>__hubSeeds.react.createElement('div',{'data-native-panel':'future-reader'},'Future reader settings'))`);
    await settle();
    await typeSearch('gif');
    check('explicit future settings registration is searchable', await ev("[...document.querySelectorAll('[data-plugin-hub-item]')].map(e=>e.dataset.pluginHubItem)"), ['future-reader']);
    await click('[data-plugin-hub-item="future-reader"]');
    check('future child panel renders', await ev("!!document.querySelector('[data-native-panel=" + '"future-reader"' + "]')"), true);
    await ev('__futureDispose()');
    await settle();
    check('removing selected plugin returns to list', await ev("!!document.querySelector('input[aria-label=" + '"搜索插件配置"' + "]')"), true);
    await click('[aria-label="清空插件搜索"]');

    await ev(`globalThis.__actionDispose=__ctx.pluginHub.registerAction({id:'read-media',label:'视频/GIF',description:'原始媒体导入',order:10,run:context=>{__actionCalls.push({id:'read-media',sessionId:context.sessionId});}});globalThis.__disabledDispose=__ctx.pluginHub.registerAction({id:'disabled',label:'不可用扩展',order:20,enabled:()=>false,run:()=>{throw new Error('Disabled action executed');}});globalThis.__hiddenDispose=__ctx.pluginHub.registerAction({id:'hidden',label:'仅其他会话',order:30,when:context=>context.sessionId==='other',run:()=>{}})`);
    await click('[data-plugin-hub-pocket]');
    check('disabled action is present and hidden action omitted', await ev("[...document.querySelectorAll('[role=" + '"menuitem"' + "]')].map(e=>({text:e.textContent,disabled:e.disabled})).filter(e=>!e.text.includes('插件配置'))"), [{ text: '视频/GIF原始媒体导入', disabled: false }, { text: '不可用扩展', disabled: true }]);
    check('opening pocket focuses an enabled action', await ev("document.activeElement.getAttribute('role')"), 'menuitem');
    await browser.screenshot('pocket-light');
    await ev("document.querySelector('[role=" + '"menu"' + "]').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}))");
    check('keyboard skips disabled actions', await ev('document.activeElement.disabled'), false);
    await ev("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
    await settle();
    check('Escape closes pocket and restores trigger focus', await ev("({open:!!document.querySelector('[role=" + '"menu"' + "]'),focus:document.activeElement.hasAttribute('data-plugin-hub-pocket')})"), { open: false, focus: true });
    await click('[data-plugin-hub-pocket]');
    await ev("[...document.querySelectorAll('[role=" + '"menuitem"' + "]')].find(e=>e.textContent.includes('视频/GIF')).click()");
    await settle();
    check('action receives current session and menu closes', await ev("({calls:__actionCalls,open:!!document.querySelector('[role=" + '"menu"' + "]')})"), { calls: [{ id: 'read-media', sessionId: 'session-a' }], open: false });

    await ev('__setSession("session-b")');
    await settle();
    await click('[data-plugin-hub-pocket]');
    await ev("[...document.querySelectorAll('[role=" + '"menuitem"' + "]')].find(e=>e.textContent.includes('视频/GIF')).click()");
    await settle();
    check('session changes do not reuse a stale action context', await ev('__actionCalls.at(-1).sessionId'), 'session-b');
    await ev(`globalThis.__slowDispose=__ctx.pluginHub.registerAction({id:'slow',label:'等待扩展',run:context=>new Promise(resolve=>{__slowSignal=context.signal;context.signal.addEventListener('abort',resolve,{once:true});})})`);
    await click('[data-plugin-hub-pocket]');
    await ev("[...document.querySelectorAll('[role=" + '"menuitem"' + "]')].find(e=>e.textContent.includes('等待扩展')).click()");
    await settle();
    await ev('__setSession("session-c")');
    await settle();
    check('switching session aborts in-flight action and closes pocket', await ev("({aborted:__slowSignal.aborted,open:!!document.querySelector('[role=" + '"menu"' + "]')})"), { aborted: true, open: false });
    await ev('__slowDispose();__actionDispose();__disabledDispose();__hiddenDispose()');

    await ev(`globalThis.__errorDispose=__ctx.pluginHub.registerAction({id:'error-action',label:'错误扩展',run:()=>{throw new Error('Fixture action failure');}})`);
    await click('[data-plugin-hub-pocket]');
    await ev("[...document.querySelectorAll('[role=" + '"menuitem"' + "]')].find(e=>e.textContent.includes('错误扩展')).click()");
    await settle();
    check('an action failure leaves the menu usable with an explanation', await ev("({open:!!document.querySelector('[role=" + '"menu"' + "]'),message:document.querySelector('[role=" + '"alert"' + "]')?.textContent,busy:[...document.querySelectorAll('[role=" + '"menuitem"' + "]')].some(e=>e.disabled&&e.textContent.includes('错误扩展'))})"), {open:true,message:'Fixture action failure',busy:false});
    await ev("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));__errorDispose()");

    await browser.send('Emulation.setDeviceMetricsOverride', { width: 440, height: 760, deviceScaleFactor: 1.25, mobile: false });
    await settle();
    await click('[data-plugin-hub-pocket]');
    check('pocket stays inside a narrow viewport', await ev("(()=>{const r=document.querySelector('[role=" + '"menu"' + "]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()"), true);
    await browser.screenshot('pocket-narrow');
    await ev("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

    await ev('__hubFiber.dispose()');
    await settle();
    check('unload restores native sidebar and removes only hub entry', await nav(), ['general', 'oauth', 'token-usage', 'plugins', 'startup-screen', 'chat-wallpaper']);
    check('unload removes pocket, style and child slot', await ev("({pocket:!!document.querySelector('[data-plugin-hub-pocket]'),style:!!document.querySelector('style[data-plugin=" + '"dsh-plugin-hub"' + "]'),child:!!__ctx.slots.spec('plugin-hub.settings')})"), { pocket: false, style: false, child: false });
    check('unload completely restores the original entries property descriptor', await ev("(()=>{const before=__originalEntriesDescriptor,after=Object.getOwnPropertyDescriptor(__ctx.slots,'entries');return before===undefined?after===undefined:after!==undefined&&before.value===after.value&&before.get===after.get&&before.set===after.set&&before.enumerable===after.enumerable&&before.configurable===after.configurable&&before.writable===after.writable;})()"), true);
    await ev('__setActive("startup-screen")');
    await settle();
    check('original panel still renders after hub unload', await ev("!!document.querySelector('[data-native-panel=" + '"startup-screen"' + "]')"), true);
    await click('[data-native-panel="startup-screen"] input');
    check('original save callback still works after hub unload', await ev('__saved.at(-1)'), { id: 'startup-screen', value: false });
    for(let iteration=0;iteration<2;iteration++) {
      await ev('__hubFiber=__ctx.plugin(__plugin);__setActive("plugin-hub")');
      await settle();
      check('hot reload '+(iteration+1)+' groups only the requested panels', await nav(), ['general', 'oauth', 'token-usage', 'plugins', 'plugin-hub']);
      check('hot reload '+(iteration+1)+' creates exactly one style and pocket', await ev("({styles:document.querySelectorAll('style[data-plugin=" + '"dsh-plugin-hub"' + "]').length,pockets:document.querySelectorAll('[data-plugin-hub-pocket]').length})"), {styles:1,pockets:1});
      await ev('__hubFiber.dispose()');
      await settle();
      check('hot unload '+(iteration+1)+' restores sidebar and removes descriptor', await ev("({ids:[...document.querySelectorAll('[data-native-nav]')].map(e=>e.dataset.nativeNav),own:Object.prototype.hasOwnProperty.call(__ctx.slots,'entries')})"), {ids:['general','oauth','token-usage','plugins','startup-screen','chat-wallpaper'],own:originalEntriesOwn});
    }
    check('browser completed without runtime errors', browser.errors, []);
    fs.writeFileSync(path.join(artifactsDir, 'browser-results.json'), JSON.stringify({ passed: checks.length, checks, errors: browser.errors }, null, 2));
  } finally { await browser.close(); }
});
