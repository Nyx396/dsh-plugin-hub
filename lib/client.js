window.__ModuleLoader__.load({
  id: 'dsh-plugin-hub',
  factory(require) {
    'use strict';
    const React = require('react');
    const { createPortal } = require('react-dom');
    const h = React.createElement;
    const SETTINGS = 'plugin-hub.settings';
    const GROUPED = new Map([
      ['startup-screen', { description: '开机画面、动画模板与声音', keywords: '开机 启动 动画 模板 声音 音量 速度 时长 跳过 字幕 startup splash boot sound template' }],
      ['chat-wallpaper', { description: '聊天壁纸、视频与横幅', keywords: '聊天 背景 壁纸 视频 图片 横幅 透明度 循环 淡出 wallpaper background video image banner' }],
    ]);
    const CSS = `
.dph-root,.dph-menu{--dph-text:var(--dsw-alias-label-primary,#ececef);--dph-muted:var(--dsw-alias-label-secondary,#aaaab2);--dph-border:var(--dsw-alias-border-l2,#39393f);--dph-surface:var(--dsw-alias-bg-layer-2,#242427);--dph-hover:var(--dsw-alias-interactive-bg-hover-solid,#ffffff0b);--dph-accent:var(--dsw-alias-brand-primary,#8c82e8);color:var(--dph-text);font:inherit;min-width:0;box-sizing:border-box}
.dph-root *,.dph-menu *{box-sizing:border-box}.dph-root button,.dph-root input,.dph-menu button{font:inherit}.dph-root button,.dph-menu button{color:inherit;cursor:pointer}.dph-root button:disabled,.dph-menu button:disabled{cursor:default;opacity:.55}.dph-root button:focus-visible,.dph-root input:focus-visible,.dph-menu button:focus-visible,.dph-pocket:focus-visible{outline:2px solid var(--dph-accent,var(--dsw-alias-brand-primary,#8c82e8));outline-offset:3px}
.dph-root{width:100%;max-width:1120px;padding-bottom:12px}.dph-root h2,.dph-root p{margin:0}.dph-root h2{font-size:20px;line-height:1.4;font-weight:600}.dph-subtitle{font-size:13px;line-height:1.6;color:var(--dph-muted);margin-top:6px!important}.dph-head{margin-bottom:18px}.dph-search{display:flex;align-items:center;gap:9px;border:1px solid var(--dph-border);border-radius:9px;min-height:38px;padding:0 10px;margin-bottom:12px;background:transparent}.dph-search:focus-within{border-color:var(--dph-accent)}.dph-search svg{flex:0 0 16px;color:var(--dph-muted)}.dph-search input{width:100%;min-width:0;outline:none!important;color:var(--dph-text);border:0;background:transparent;padding:9px 0;font-size:13px}.dph-search input::placeholder{color:var(--dph-muted)}.dph-clear{flex:0 0 auto;background:transparent;border:0;border-radius:4px;padding:3px 5px;font-size:12px!important;color:var(--dph-muted)!important}.dph-clear:hover{background:var(--dph-hover)}.dph-count{color:var(--dph-muted);font-size:12px;line-height:1.5;margin:0 0 12px!important}.dph-list{display:flex;flex-direction:column;gap:8px}.dph-item{width:100%;display:flex;align-items:center;gap:12px;min-height:68px;text-align:left;border:1px solid var(--dph-border);border-radius:10px;background:transparent;padding:13px 14px}.dph-item:hover{background:var(--dph-hover)}.dph-item-icon{width:32px;height:32px;display:grid;place-items:center;flex-shrink:0;border:1px solid var(--dph-border);border-radius:8px;color:var(--dph-muted)}.dph-item-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.dph-item-title{font-size:14px;font-weight:550;overflow-wrap:anywhere}.dph-item-description{font-size:12px;color:var(--dph-muted);line-height:1.5;overflow-wrap:anywhere}.dph-chevron{flex-shrink:0;color:var(--dph-muted)}.dph-empty{border:1px dashed var(--dph-border);border-radius:10px;padding:28px 18px;color:var(--dph-muted);font-size:13px;line-height:1.7;text-align:center}.dph-back{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;padding:4px 1px;border-radius:4px;font-size:12px!important;color:var(--dph-muted)!important;margin-bottom:16px}.dph-back:hover{color:var(--dph-text)!important}.dph-page-head{border-bottom:1px solid var(--dph-border);padding-bottom:14px;margin-bottom:18px}.dph-pane{min-width:0}.dph-pane>*{max-width:100%}.dph-error{padding:12px;border:1px solid var(--dph-border);border-radius:8px;font-size:13px;line-height:1.6;color:var(--dph-muted)}
.dph-pocket{appearance:none;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:32px;height:32px;padding:3px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#aaaab2);cursor:pointer;line-height:1}.dph-pocket:hover,.dph-pocket[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover-solid,#ffffff0d);color:var(--dsw-alias-label-primary,#ececef)}.dph-pocket svg{width:24px;height:24px;display:block}.dph-menu{position:fixed;z-index:1500;width:272px;max-width:calc(100vw - 24px);max-height:min(420px,calc(100vh - 24px));overflow-y:auto;overscroll-behavior:contain;padding:6px;border:1px solid var(--dph-border);border-radius:11px;background:var(--dph-surface);box-shadow:0 8px 28px #0003;font-size:13px}.dph-menu-title{margin:2px 8px 7px;font-size:11px;color:var(--dph-muted);line-height:1.5}.dph-action{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px;border:0;border-radius:6px;background:transparent;line-height:1.5}.dph-action:hover,.dph-action:focus-visible{background:var(--dph-hover)}.dph-action-copy{min-width:0;display:flex;flex-direction:column;gap:2px;overflow-wrap:anywhere}.dph-action-title{font-weight:500}.dph-action-description{color:var(--dph-muted);font-size:12px}.dph-menu-empty{padding:13px 10px 16px;line-height:1.7;color:var(--dph-muted);font-size:12px}.dph-menu-error{font-size:12px;color:var(--dph-text);padding:8px 10px;line-height:1.6;border-top:1px solid var(--dph-border)}
@media(max-width:520px){.dph-root h2{font-size:18px}.dph-item{padding:11px}.dph-item-icon{width:28px;height:28px}}@media(forced-colors:active){.dph-item,.dph-search,.dph-menu{border-color:CanvasText}.dph-pocket{color:ButtonText}}@media(prefers-reduced-motion:reduce){.dph-root *,.dph-menu *,.dph-pocket{animation:none!important;transition:none!important}}
`;

    function Icon({ kind = 'square-plus', size = 20, ...props }) {
      const paths = {
        'square-plus': [h('rect', { key: 'box', x: 3.5, y: 3.5, width: 17, height: 17, rx: 3 }), h('path', { key: 'plus', d: 'M12 7.5v9M7.5 12h9' })],
        search: h('path', { d: 'M16.5 16.5 21 21M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z' }),
        back: h('path', { d: 'm14.5 6-6 6 6 6' }),
        next: h('path', { d: 'm9 6 6 6-6 6' }),
        settings: [h('rect', { key: 'box', x: 4, y: 4, width: 16, height: 16, rx: 3 }), h('path', { key: 'sliders', d: 'M8 8h8M8 12h8M8 16h8M10 6.5v3M14 10.5v3M11 14.5v3' })],
        'startup-screen': [h('rect', { key: 'box', x: 3, y: 4, width: 18, height: 16, rx: 3 }), h('path', { key: 'play', d: 'm10 8 6 4-6 4Z' })],
        'chat-wallpaper': [h('rect', { key: 'box', x: 3, y: 4, width: 18, height: 16, rx: 3 }), h('path', { key: 'land', d: 'm3 16 5-5 5 5 3-3 5 5M16 8h.01' })],
      };
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props }, paths[kind] || paths.settings);
    }

    function textLabel(value, fallback) {
      try { const label = typeof value === 'function' ? value() : value; return typeof label === 'string' && label.trim() ? label : fallback; }
      catch { return fallback; }
    }
    function matchesQuery(item, query) {
      const tokens = String(query || '').normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
      const words = [item.id, item.label, item.description, ...(Array.isArray(item.keywords) ? item.keywords : [item.keywords])].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase();
      return tokens.every(token => words.includes(token));
    }
    function validId(id) {
      if (typeof id !== 'string' || !id.trim() || id !== id.trim()) throw new TypeError('Plugin Hub registration requires a non-empty id without surrounding spaces.');
      return id;
    }

    /** Identity-stable external store. Registrations belong to the contributing plugin. */
    function createHubStore() {
      const actions = new Map();
      const listeners = new Set();
      let settings = [], snapshot = Object.freeze({ actions: [], settings: [] });
      const publish = () => {
        snapshot = Object.freeze({ actions: [...actions.values()].sort((a, b) => a.order - b.order), settings });
        for (const listener of [...listeners]) listener();
      };
      return {
        getSnapshot: () => snapshot,
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        registerAction(definition) {
          const id = validId(definition?.id);
          if (actions.has(id)) throw new Error('Duplicate Plugin Hub action: ' + id);
          if (typeof definition.run !== 'function') throw new TypeError('Plugin Hub action requires run(context).');
          const action = { ...definition, id, order: Number.isFinite(definition.order) ? definition.order : 0 };
          actions.set(id, action); publish();
          let active = true;
          return () => { if (!active) return; active = false; if (actions.get(id) === action) { actions.delete(id); publish(); } };
        },
        setSettings(rows) { settings = rows; publish(); },
        refresh: publish,
        dispose() { actions.clear(); settings = []; publish(); listeners.clear(); },
      };
    }

    /** Filter only the navigation inspection face. The real slot renderer remains intact. */
    function installNavigationFilter(slots, grouped) {
      const ownDescriptor = Object.getOwnPropertyDescriptor(slots, 'entries');
      const original = slots.entries;
      let active = true, previous, previousKey, filtered;
      function entries(key) {
        const rows = original.call(this, key);
        if (!active || key !== 'settings.section') return rows;
        const keyIds = [...grouped].join('\0');
        if (rows !== previous || keyIds !== previousKey) {
          previous = rows; previousKey = keyIds;
          filtered = rows.filter(row => !grouped.has(row.options.id));
        }
        return filtered;
      }
      slots.entries = entries;
      return {
        originalEntries: key => original.call(slots, key),
        dispose() {
          active = false;
          // Cordis returns a new traced function Proxy on every property read.
          // Compare the stored descriptor, not slots.entries === entries.
          if (Object.getOwnPropertyDescriptor(slots, 'entries')?.value !== entries) return;
          if (ownDescriptor) Object.defineProperty(slots, 'entries', ownDescriptor);
          else delete slots.entries;
        },
      };
    }

    class PanelBoundary extends React.Component {
      constructor(props) { super(props); this.state = { failed: false }; }
      static getDerivedStateFromError() { return { failed: true }; }
      render() { return this.state.failed ? h('div', { className: 'dph-error', role: 'alert' }, '这个插件面板暂时无法显示。返回后可重试，其他设置仍可使用。') : this.props.children; }
    }

    function HubPanel({ hub, renderSlot, close }) {
      const { settings } = React.useSyncExternalStore(hub.subscribe, hub.getSnapshot, hub.getSnapshot);
      const [query, setQuery] = React.useState('');
      const [selected, setSelected] = React.useState(null);
      const selection = settings.find(row => row.id === selected);
      const search = React.useRef(null), back = React.useRef(null);
      React.useEffect(() => { if (selected && !selection) setSelected(null); }, [selected, selection]);
      const choose = id => { setSelected(id); requestAnimationFrame(() => back.current?.focus()); };
      const goBack = () => { setSelected(null); requestAnimationFrame(() => search.current?.focus()); };
      const visible = settings.filter(row => matchesQuery(row, query));
      return h('section', { className: 'dph-root', 'data-plugin-hub': 'settings' }, selection ? h(React.Fragment, null,
        h('div', { className: 'dph-page-head' },
          h('button', { type: 'button', className: 'dph-back', onClick: goBack, ref: back }, h(Icon, { kind: 'back', size: 15 }), '返回插件配置'),
          h('h2', null, selection.label)),
        h('div', { className: 'dph-pane', 'data-plugin-hub-panel': selection.id }, h(PanelBoundary, { key: selection.id }, renderSlot(SETTINGS, { close }, { only: selection.id })))) : h(React.Fragment, null,
        h('div', { className: 'dph-head' }, h('h2', null, '插件配置'), h('p', { className: 'dph-subtitle' }, '在这里查找和调整扩展插件。')),
        h('label', { className: 'dph-search' }, h(Icon, { kind: 'search', size: 16 }),
          h('input', { type: 'search', value: query, onChange: event => setQuery(event.target.value), placeholder: '搜索插件名称或关键词', 'aria-label': '搜索插件配置', ref: search, autoComplete: 'off' }),
          query ? h('button', { type: 'button', className: 'dph-clear', onClick: () => { setQuery(''); search.current?.focus(); }, 'aria-label': '清空插件搜索' }, '清空') : null),
        h('p', { className: 'dph-count', role: 'status', 'aria-live': 'polite' }, query.trim() ? `找到 ${visible.length} 项配置` : `共 ${settings.length} 项配置`),
        h('div', { className: 'dph-list' }, visible.length ? visible.map(row => h('button', { type: 'button', key: row.id, className: 'dph-item', onClick: () => choose(row.id), 'data-plugin-hub-item': row.id },
          h('span', { className: 'dph-item-icon' }, h(Icon, { kind: row.id, size: 19 })),
          h('span', { className: 'dph-item-copy' }, h('span', { className: 'dph-item-title' }, row.label), row.description ? h('span', { className: 'dph-item-description' }, row.description) : null), h(Icon, { kind: 'next', size: 16, className: 'dph-chevron' }))) : h('div', { className: 'dph-empty' }, settings.length ? '没有找到匹配的插件配置，试试其他关键词。' : '还没有可收纳的插件配置。启用相关插件后，它们会显示在这里。'))));
    }

    function Pocket({ hub, ...props }) {
      const state = React.useSyncExternalStore(hub.subscribe, hub.getSnapshot, hub.getSnapshot);
      const [open, setOpen] = React.useState(false), [error, setError] = React.useState(''), [busy, setBusy] = React.useState(null);
      const [position, setPosition] = React.useState({ left: 12, top: 12 });
      const trigger = React.useRef(null), menu = React.useRef(null), controller = React.useRef(null);
      const menuId = React.useId();
      const session = typeof props.useSession === 'function' ? props.useSession(value => value) : props.session;
      const context = { ...props, session, sessionId: props.sessionId ?? session?.sessionId };
      const actions = state.actions.filter(action => {
        try { return typeof action.when !== 'function' || action.when(context); } catch { return false; }
      });
      const close = (focus = true) => { setOpen(false); setError(''); if (focus) trigger.current?.focus(); };
      const place = React.useCallback(() => {
        if (!trigger.current || !menu.current) return;
        const anchor = trigger.current.getBoundingClientRect(), box = menu.current.getBoundingClientRect();
        const width = document.documentElement.clientWidth, height = window.innerHeight;
        const top = anchor.top - box.height - 8;
        setPosition({ left: Math.max(12, Math.min(anchor.left, width - box.width - 12)), top: Math.max(12, Math.min(top >= 12 ? top : anchor.bottom + 8, height - box.height - 12)) });
      }, []);
      React.useLayoutEffect(() => { if (open) place(); }, [open, state, place]);
      React.useEffect(() => {
        if (!open) return;
        const outside = event => { if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) close(false); };
        const key = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } };
        document.addEventListener('pointerdown', outside, true);
        document.addEventListener('keydown', key, true);
        window.addEventListener('resize', place);
        document.addEventListener('scroll', place, true);
        const frame = requestAnimationFrame(() => (menu.current?.querySelector('button:not(:disabled)') || menu.current)?.focus());
        return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', key, true); window.removeEventListener('resize', place); document.removeEventListener('scroll', place, true); cancelAnimationFrame(frame); };
      }, [open, place]);
      React.useEffect(() => () => controller.current?.abort(), []);
      // A mounted composer can be rebound to another Session. Never keep an action on its old Session.
      React.useEffect(() => { controller.current?.abort(); setBusy(null); setOpen(false); setError(''); }, [context.sessionId]);
      const execute = async action => {
        controller.current?.abort();
        const aborter = new AbortController(); controller.current = aborter;
        setBusy(action.id); setError('');
        try {
          await action.run({ ...context, signal: aborter.signal, closeMenu: () => close(false) });
          if (!aborter.signal.aborted) close(false);
        } catch (cause) {
          if (!aborter.signal.aborted) setError(typeof cause?.message === 'string' ? cause.message : '扩展功能执行失败，请重试。');
        } finally { if (controller.current === aborter) { controller.current = null; setBusy(null); } }
      };
      const navigation = event => {
        const buttons = [...menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
        if (event.key === 'Tab') { close(); return; }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !buttons.length) return;
        event.preventDefault();
        const current = buttons.indexOf(document.activeElement);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[index].focus();
      };
      return h(React.Fragment, null,
        h('button', { type: 'button', className: 'dph-pocket', ref: trigger, 'data-plugin-hub-pocket': '', title: '扩展功能', 'aria-label': '扩展功能', 'aria-haspopup': 'menu', 'aria-controls': open ? menuId : undefined, 'aria-expanded': open, onClick: () => { setError(''); setOpen(value => !value); }, onKeyDown: event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); } } }, h(Icon)),
        open ? createPortal(h('div', { className: 'dph-menu', id: menuId, role: 'menu', 'aria-label': '扩展功能', ref: menu, tabIndex: -1, style: position, onKeyDown: navigation },
          h('div', { className: 'dph-menu-title', role: 'presentation' }, '扩展功能'),
          actions.length ? actions.map(action => {
            let enabled = true;
            try { enabled = typeof action.enabled !== 'function' || action.enabled(context); } catch { enabled = false; }
            return h('button', { type: 'button', key: action.id, role: 'menuitem', className: 'dph-action', disabled: busy !== null || !enabled, onClick: () => execute(action) },
              h(Icon, { kind: 'square-plus', size: 19 }), h('span', { className: 'dph-action-copy' }, h('span', { className: 'dph-action-title' }, textLabel(action.label, action.id)), action.description ? h('span', { className: 'dph-action-description' }, action.description) : null));
          }) : h('div', { className: 'dph-menu-empty', role: 'presentation' }, '暂无扩展功能。', h('br'), '后续的视频/GIF等扩展会收纳在这里。'),
          busy ? h('div', { className: 'dph-menu-title', role: 'status' }, '正在打开…') : null,
          error ? h('div', { className: 'dph-menu-error', role: 'alert' }, error) : null), document.body) : null);
    }

    function apply(ctx) {
      const slots = ctx.slots;
      const hub = createHubStore();
      const grouped = new Set();
      const aliases = new Map();
      const metadata = new Map();
      const navigation = installNavigationFilter(slots, grouped);
      let live = true;
      const log = message => ctx.logger?.warn?.('[plugin-hub] ' + message);
      const refreshSettings = () => {
        if (!live) return;
        const rows = navigation.originalEntries(SETTINGS);
        const found = new Set();
        hub.setSettings(rows.filter(entry => {
          const id = entry.options.id;
          if (!id || found.has(id)) return false;
          found.add(id); return true;
        }).map(entry => {
          const id = entry.options.id, meta = metadata.get(id) || GROUPED.get(id) || {};
          return { id, label: textLabel(entry.options.label, id), description: meta.description || '', keywords: meta.keywords || '', order: entry.options.order || 0 };
        }).sort((a, b) => a.order - b.order));
      };
      const nudgeNavigation = () => {
        // The native shell caches by the settings.section registry version.
        const remove = slots.register({ name: 'settings.section', id: 'plugin-hub-refresh', order: 100000, label: '' }, () => null);
        remove();
      };
      const syncLegacy = () => {
        if (!live) return;
        const entries = navigation.originalEntries('settings.section');
        let changed = false;
        for (const [id] of GROUPED) {
          const entry = entries.find(item => item.options.id === id);
          const old = aliases.get(id);
          if (old?.entry === entry) continue;
          if (old) { old.dispose(); aliases.delete(id); grouped.delete(id); changed = true; }
          if (!entry) continue;
          // These two existing Boot Suite panels have no child slots or stores.
          // Fail open after a future incompatible update: keep the native entry visible.
          if (entry.children && Object.keys(entry.children).length || entry.store || entry.inject) {
            log('Original panel changed; keeping its sidebar entry: ' + id); continue;
          }
          try {
            const dispose = slots.register({ name: SETTINGS, id, order: entry.options.order, label: entry.options.label, locale: entry.locale, registrant: entry.registrant }, entry.component);
            aliases.set(id, { entry, dispose }); grouped.add(id); changed = true;
          } catch (error) { log('Could not group ' + id + ': ' + error.message); }
        }
        if (changed) { refreshSettings(); nudgeNavigation(); }
      };
      hub.registerSettings = (definition, component) => {
        const id = validId(definition?.id);
        if (GROUPED.has(id) || metadata.has(id) || navigation.originalEntries(SETTINGS).some(entry => entry.options.id === id)) throw new Error('Duplicate Plugin Hub settings: ' + id);
        if (typeof component !== 'function' && typeof component !== 'object') throw new TypeError('Plugin Hub settings requires a React component.');
        const { description, keywords, ...options } = definition;
        metadata.set(id, { description, keywords });
        let dispose;
        try { dispose = slots.register({ ...options, name: SETTINGS, id }, component); }
        catch (error) { metadata.delete(id); throw error; }
        refreshSettings();
        let active = true;
        return () => { if (!active) return; active = false; dispose(); metadata.delete(id); refreshSettings(); };
      };
      // Version adapter: the native settings owner intentionally reuses this store instance.
      // Capability checks keep a future incompatible host from receiving a guessed action.
      const nativeSettings = () => {
        const entry = slots.entriesOfSlot?.('sidebar.settings')?.[0];
        const instance = typeof entry?.store?.create === 'function' ? entry.store.create() : undefined;
        return typeof instance?.actions?.openSection === 'function' ? instance.actions : undefined;
      };
      hub.openSettings = () => {
        const actions = nativeSettings();
        if (!actions) throw new Error('当前 DSH 暂不支持快捷打开，请从设置侧栏进入“插件配置”。');
        actions.openSection('plugin-hub');
      };
      hub.registerAction({ id: 'plugin-hub:settings', label: '插件配置', description: '打开集中收纳的插件选项', order: 10000, enabled: () => !!nativeSettings(), run: hub.openSettings });
      ctx.reflect.provide('pluginHub', hub);
      ctx.effect(() => {
        const tag = document.createElement('style'); tag.dataset.plugin = 'dsh-plugin-hub'; tag.textContent = CSS; document.head.appendChild(tag);
        return () => tag.remove();
      });
      // Native slot registration owns its own lifetime. Register the child declaration first.
      slots.inject('settings.section', () => {
        const dispose = slots.register({ name: 'settings.section', id: 'plugin-hub', order: 25, label: '插件配置', children: { [SETTINGS]: { kind: 'list', scope: 'root' } }, inject: () => ({ hub }) }, HubPanel);
        syncLegacy();
        const offOriginal = slots.subscribe('settings.section', syncLegacy);
        const offChildren = slots.subscribe(SETTINGS, refreshSettings);
        refreshSettings();
        return () => { offOriginal(); offChildren(); for (const alias of aliases.values()) alias.dispose(); aliases.clear(); grouped.clear(); dispose(); };
      });
      slots.inject('conversation.input.left', () => slots.register({ name: 'conversation.input.left', id: 'plugin-hub', order: -100, inject: () => ({ hub }) }, Pocket));
      ctx.effect(() => () => { live = false; navigation.dispose(); grouped.clear(); hub.dispose(); });
    }

    return { inject: ['slots'], apply, createHubStore, matchesQuery, installNavigationFilter, HubPanel, Pocket };
  },
});
