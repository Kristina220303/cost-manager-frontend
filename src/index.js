import React from 'react';
import ReactDOM from 'react-dom/client';

// Material UI theme provider and CSS reset
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import custom theme and global styles
import theme from './theme';
import './index.css';

// Import main application component
import App from './App';

// Create React root and render the application
// ThemeProvider applies global theme styling
// CssBaseline resets default browser styles
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);


