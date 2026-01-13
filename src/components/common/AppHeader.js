import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

// Header component of the application
// Responsible only for displaying the application title
function AppHeader() {
    return (
        <AppBar 
            position="static" 
            elevation={0}
            sx={{
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid rgba(193, 219, 232, 0.3)',
                color: '#43302E'
            }}
        >
            {/* Toolbar is used to align and center the header content */}
            <Toolbar 
                sx={{ 
                    minHeight: { xs: 64, sm: 64 },
                    justifyContent: 'center'
                }}
            >
                {/* Application title text */}
                {/* Typography component is used for consistent text styling */}
                <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                        fontFamily: '"Playfair Display", "Cormorant Garamond", "Libre Baskerville", serif',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        color: '#43302E',
                        fontSize: { xs: '1.75rem', sm: '2rem' },
                        textAlign: 'center'
                    }}
                >
                    Cost Manager
                </Typography>
            </Toolbar>
        </AppBar>
    );
}

// Export header component for use in App.js
export default AppHeader;


