import React from 'react';

export function GTALayout({ children }) {
    return (
        <div className="gta-layout-wrapper" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
        </div>
    );
}
