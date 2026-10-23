import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, Avatar, Badge, Button, Dropdown } from 'antd';
import { router, usePage } from '@inertiajs/react';
import {
    DashboardOutlined,
    FolderOpenOutlined,
    FileTextOutlined,
    TeamOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    SearchOutlined,
    BellOutlined,
    DownOutlined,
} from '@ant-design/icons';

/* changement de couleur selon la section active */
const sections = [
    { key: 'dashboard', label: 'Dashboard',  icon: <DashboardOutlined />,  accent: '#5B6CF0', tint: '#E7EAFE', bg: '#F3F4FD' },
    { key: 'dossiers',  label: 'Dossiers',   icon: <FolderOpenOutlined />, accent: '#DB7A1F', tint: '#FCE9D2', bg: '#FEF6EC' },
    { key: 'documents', label: 'Documents',  icon: <FileTextOutlined />,   accent: '#14967F', tint: '#D6F1EA', bg: '#EEF9F6' },
    { key: 'clients',   label: 'Clients',    icon: <TeamOutlined />,       accent: '#E04F86', tint: '#FADCE8', bg: '#FEF1F6' },
    { key: 'settings',  label: 'Paramètres', icon: <SettingOutlined />,    accent: '#7C5CE0', tint: '#E6DFFA', bg: '#F5F2FD' },
];

const brandColors = sections.map((s) => s.accent);

const userMenu = {
    items: [
        { key: 'profile', icon: <UserOutlined />, label: 'Mon profil' },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Déconnexion', danger: true },
    ],
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&display=swap');

.td-root {
    min-height: 100vh;
    background: var(--td-bg);
    color: #262A3D;
    font-family: 'Bricolage Grotesque', -apple-system, 'Segoe UI', sans-serif;
    transition: background-color .6s ease;
    box-sizing: border-box;
}

/* ---------- Rail flottant ---------- */
.td-rail {
    position: fixed; top: 16px; left: 16px; bottom: 16px; z-index: 30;
    width: 76px; padding: 14px;
    display: flex; flex-direction: column;
    background: #fff; border-radius: 28px; overflow: hidden;
    box-shadow: 0 10px 30px rgba(40, 40, 90, .08);
    transition: width .38s cubic-bezier(.2, .8, .2, 1), box-shadow .3s ease;
}
.td-rail:hover, .td-rail:focus-within {
    width: 236px;
    box-shadow: 0 24px 56px rgba(40, 40, 90, .18);
}

.td-brand { display: flex; align-items: center; gap: 14px; height: 48px; padding-left: 4px; }
.td-mark { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 40px; height: 40px; flex-shrink: 0; }
.td-mark i { border-radius: 9px; display: block; }
.td-mark i:nth-child(1) { border-radius: 14px 5px 5px 5px; }
.td-mark i:nth-child(4) { border-radius: 5px 5px 14px 5px; }
.td-brand-name { font-size: 20px; font-weight: 700; letter-spacing: -.02em; white-space: nowrap; }

.td-nav { position: relative; display: flex; flex-direction: column; gap: 6px; margin-top: 28px; flex: 1; }
.td-nav .td-last { margin-top: auto; }

.td-ind {
    position: absolute; top: 0; left: 0; right: 0; height: 48px; border-radius: 18px;
    background: var(--td-accent);
    box-shadow: 0 10px 20px -8px var(--td-accent);
    transform: translate(var(--ix, 0px), var(--iy, 0px));
    transition: transform .45s cubic-bezier(.3, 1.35, .5, 1), background-color .4s ease, box-shadow .4s ease;
}

.td-item {
    position: relative; z-index: 1; width: 100%; height: 48px;
    display: flex; align-items: center; gap: 14px; padding: 0 12px;
    border: 0; border-radius: 18px; background: transparent; cursor: pointer;
    font: inherit; font-weight: 500; color: #5A5F78; white-space: nowrap; text-align: left;
    transition: background-color .2s ease, color .25s ease;
}
.td-item:hover:not(.is-active) { background: var(--c-tint); color: #262A3D; }
.td-item:focus-visible { outline: 2px solid var(--c); outline-offset: 2px; }
.td-ico { width: 24px; flex-shrink: 0; display: grid; place-items: center; font-size: 19px; color: var(--c); transition: color .25s ease; }
.td-item.is-active { color: #fff; font-weight: 600; }
.td-item.is-active .td-ico { color: #fff; }

.td-label { opacity: 0; transform: translateX(-8px); transition: opacity .2s ease, transform .3s ease; }
.td-rail:hover .td-label, .td-rail:focus-within .td-label { opacity: 1; transform: none; transition-delay: .08s; }

/* ---------- Zone principale ---------- */
.td-main {
    width: 100%;
    max-width: 1600px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 16px 24px 24px 124px;
    box-sizing: border-box;
}
.td-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 24px; }
.td-title { margin: 0; font-size: 28px; line-height: 1.15; font-weight: 700; letter-spacing: -.02em; }
.td-date { margin-top: 4px; font-size: 14px; color: #6B7090; }
.td-tools { display: flex; align-items: center; gap: 12px; }

.td-search.ant-input-affix-wrapper { width: 280px; border-radius: 999px; border-color: transparent; box-shadow: 0 2px 10px rgba(40, 40, 90, .06); }
.td-bell { background: #fff; box-shadow: 0 2px 10px rgba(40, 40, 90, .06); }

.td-user {
    display: flex; align-items: center; gap: 10px; padding: 5px 12px 5px 5px; border-radius: 999px;
    background: #fff; box-shadow: 0 2px 10px rgba(40, 40, 90, .06); cursor: pointer;
    transition: box-shadow .2s ease;
}
.td-user:hover { box-shadow: 0 6px 18px rgba(40, 40, 90, .12); }
.td-user:focus-visible { outline: 2px solid var(--td-accent); outline-offset: 2px; }
.td-user-name { font-weight: 600; font-size: 14px; line-height: 1.2; }
.td-user-role { font-size: 12px; color: #6B7090; }

.td-page {
    min-height: calc(100vh - 160px);
    padding: 20px;
    margin-bottom: 8px;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 16px 40px -20px rgba(40, 40, 90, .18);
    animation: td-in .5s cubic-bezier(.2, .8, .2, 1) both;
    box-sizing: border-box;
}

@keyframes td-in {
    from { opacity: 0; transform: translateY(16px) scale(.99); }
    to   { opacity: 1; transform: none; }
}

/* ---------- Mobile : le rail devient un dock en bas ---------- */
@media (max-width: 768px) {
    .td-rail, .td-rail:hover, .td-rail:focus-within {
        top: auto; left: 12px; right: 12px; bottom: 12px; width: auto; height: 68px;
        padding: 10px; flex-direction: row; border-radius: 24px;
    }
    .td-brand, .td-label { display: none; }
    .td-nav { flex-direction: row; justify-content: space-between; margin: 0; gap: 0; }
    .td-nav .td-last { margin: 0; }
    .td-ind { right: auto; width: 48px; }
    .td-item { width: 48px; }
    .td-main {
        width: 100%;
        min-height: 100vh;
        padding: 16px 12px 100px;
        box-sizing: border-box;
    }
    .td-title { font-size: 22px; }
    .td-user-text {
    display: none !important;
    }
    .td-page {
        min-height: calc(100vh - 220px);
        padding: 18px;
        margin-bottom: 8px;
        border-radius: 22px;
        box-sizing: border-box;
    }
}

@media (prefers-reduced-motion: reduce) {
    .td-root *, .td-root *::before { transition: none !important; animation: none !important; }
}
`;

export default function AuthenticatedLayoutColorful({
    children,
    selectedKey = 'dashboard',
    onNavigate,
    userName = 'Utilisateur',
    userRole = 'Administrateur',
}) {
    const { url } = usePage();
    const [current, setCurrent] = useState(selectedKey);

    useEffect(() => {
        const path = url.split('?')[0];

        if (path === '/dossiers' || path.startsWith('/dossiers/')) {
            setCurrent('dossiers');
        } else if (path === '/dashboard' || path === '/') {
            setCurrent('dashboard');
        } else if (path.startsWith('/documents')) {
            setCurrent('documents');
        } else if (path.startsWith('/clients')) {
            setCurrent('clients');
        } else if (path.startsWith('/settings')) {
            setCurrent('settings');
        }
    }, [url]);

    const itemRefs = useRef({});
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const active = sections.find((s) => s.key === current) ?? sections[0];

    // Place l'indicateur coloré sous l'élément actif
    const measure = useCallback(() => {
        const el = itemRefs.current[current];
        if (el) setPos({ x: el.offsetLeft, y: el.offsetTop });
    }, [current]);

    useLayoutEffect(() => {
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    // L'accent d'Ant Design suit la section active (boutons, focus, liens…)
    const theme = useMemo(
        () => ({
            token: {
                colorPrimary: active.accent,
                colorInfo: active.accent,
                colorSuccess: '#2FA36B',
                colorWarning: '#E8A13A',
                colorError: '#E2566B',
                colorText: '#262A3D',
                colorTextSecondary: '#6B7090',
                borderRadius: 12,
                fontFamily: "'Bricolage Grotesque', -apple-system, 'Segoe UI', sans-serif",
            },
        }),
        [active.accent]
    );

    const select = (key) => {
        const routes = {
            dashboard: '/dashboard',
            dossiers: '/dossiers',
            documents: '/documents',
            clients: '/clients',
            settings: '/settings',
        };

        if (onNavigate) {
            onNavigate(key);
            return;
        }

        if (routes[key]) {
            router.visit(routes[key]);
        }
    };

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);

    const title = current === 'dashboard' ? `Bonjour, ${userName}` : active.label;
    const initial = userName.trim().charAt(0).toUpperCase() || 'U';

    return (
        <ConfigProvider theme={theme}>
            <style>{css}</style>

            <div
                className="td-root"
                style={{ '--td-accent': active.accent, '--td-bg': active.bg }}
            >
                {/* Rail flottant : s'ouvre au survol ou au focus clavier */}
                <aside className="td-rail" aria-label="Navigation principale">
                    <div className="td-brand">
                        <div className="td-mark" aria-hidden="true">
                            {brandColors.slice(0, 4).map((c) => (
                                <i key={c} style={{ background: c }} />
                            ))}
                        </div>
                        <span className="td-brand-name td-label">TransiDoc</span>
                    </div>

                    <nav className="td-nav">
                        <div
                            className="td-ind"
                            aria-hidden="true"
                            style={{ '--ix': `${pos.x}px`, '--iy': `${pos.y}px` }}
                        />
                        {sections.map((s, i) => (
                            <button
                                key={s.key}
                                ref={(el) => (itemRefs.current[s.key] = el)}
                                type="button"
                                className={[
                                    'td-item',
                                    s.key === current ? 'is-active' : '',
                                    i === sections.length - 1 ? 'td-last' : '',
                                ].join(' ')}
                                style={{ '--c': s.accent, '--c-tint': s.tint }}
                                aria-label={s.label}
                                aria-current={s.key === current ? 'page' : undefined}
                                onClick={() => select(s.key)}
                            >
                                <span className="td-ico">{s.icon}</span>
                                <span className="td-label">{s.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <div className="td-main">
                    <header className="td-header">
                        <div>
                            <h1 className="td-title">{title}</h1>
                            <div className="td-date">{dateLabel}</div>
                        </div>

                        <div className="td-tools">
      
                            <Badge dot color="#E04F86" offset={[-8, 8]}>
                                <Button
                                    className="td-bell"
                                    shape="circle"
                                    size="large"
                                    type="text"
                                    aria-label="Notifications"
                                    icon={<BellOutlined />}
                                />
                            </Badge>

                            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                                <div className="td-user" role="button" tabIndex={0}>
                                    <Avatar
                                        size={38}
                                        style={{ background: active.tint, color: active.accent, fontWeight: 700 }}
                                    >
                                        {initial}
                                    </Avatar>
                                    <div className="td-user-text" style={{ textAlign: 'left' }}>
                                        <div className="td-user-name">{userName}</div>
                                        <div className="td-user-role">{userRole}</div>
                                    </div>
                                    <DownOutlined style={{ fontSize: 10, color: '#6B7090' }} />
                                </div>
                            </Dropdown>
                        </div>
                    </header>

                    {/* key={current} : la page rejoue son entrée à chaque changement de section */}
                    <main key={current} className="td-page">
                        {children}
                    </main>
                </div>
            </div>
        </ConfigProvider>
    );
}