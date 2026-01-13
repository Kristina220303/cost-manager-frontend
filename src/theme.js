import { createTheme } from '@mui/material/styles';

// Create a custom Material UI theme
// Defines global colors, typography and component styles
const theme = createTheme({

    // Global color palette used across the application
    palette: {
        primary: {
            main: '#43302E',
            light: '#6B5B58',
            dark: '#2A1F1D',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#C1DBE8',
            light: '#E0F0F5',
            dark: '#9BC4D3',
            contrastText: '#43302E'
        },

        // Background colors for pages and cards
        background: {
            default: '#FAFAF7',
            paper: '#FFFFFF'
        },

        // Default text colors
        text: {
            primary: '#43302E',
            secondary: '#6B5B58'
        },

        // Additional semantic colors
        error: {
            main: '#D32F2F'
        },
        success: {
            main: '#2E7D32'
        },
        info: {
            main: '#C1DBE8'
        },
        warning: {
            main: '#FFF1B5'
        }
    },

    // Typography configuration for all text components
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif'
        ].join(','),

        // Heading styles
        h1: { fontWeight: 700, color: '#43302E' },
        h2: { fontWeight: 700, color: '#43302E' },
        h3: { fontWeight: 600, color: '#43302E' },
        h4: { fontWeight: 600, color: '#43302E' },
        h5: { fontWeight: 600, color: '#43302E' },
        h6: { fontWeight: 600, color: '#43302E' },

        // Body text styles
        body1: { fontWeight: 400, color: '#43302E' },
        body2: { fontWeight: 400, color: '#6B5B58' },

        // Button text styling
        button: {
            fontWeight: 500,
            textTransform: 'none'
        }
    },

    // Global shape configuration (rounded corners)
    shape: {
        borderRadius: 16
    },

    // Component-specific style overrides
    components: {

        // Button styling
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 500
                }
            }
        },

        // Paper / Card styling
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(67, 48, 46, 0.08)'
                }
            }
        },

        // TextField styling
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12
                    }
                }
            }
        },

        // Tabs and Tab styling
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500
                }
            }
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    backgroundColor: '#FFF1B5'
                }
            }
        }
    }
});

export default theme;
