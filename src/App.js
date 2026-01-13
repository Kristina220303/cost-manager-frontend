import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Tabs,
    Tab,
    Box,
    CircularProgress
} from '@mui/material';

// Import database initialization function
import { openCostsDB } from './lib/idb';

// Import application components
import AppHeader from './components/common/AppHeader';
import AddCost from './components/AddCost';
import Report from './components/Report';
import PieChart from './components/PieChart';
import BarChart from './components/BarChart';
import Settings from './components/Settings';

// IndexedDB configuration
const DATABASE_NAME = 'CostManagerDB';
const DATABASE_VERSION = 1;

// TabPanel component controls which tab content is visible
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {/* Render content only if the tab is active */}
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Main application component
// Manages database connection, navigation, and page rendering
function App() {

    // Holds reference to IndexedDB instance
    const [db, setDb] = useState(null);

    // Controls currently selected tab
    const [tabValue, setTabValue] = useState(0);

    // Used to trigger refresh of reports and charts
    const [refreshKey, setRefreshKey] = useState(0);

    // Initialize IndexedDB when application loads
    useEffect(function() {
        async function initDB() {
            try {
                const database = await openCostsDB(DATABASE_NAME, DATABASE_VERSION);
                setDb(database);
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        }
        initDB();
    }, []);

    // Handle tab change when user clicks a different tab
    const handleTabChange = function(event, newValue) {
        setTabValue(newValue);
    };

    // Called after a new cost item is added
    // Forces dependent components to reload data
    const handleCostAdded = function() {
        setRefreshKey(function(prev) {
            return prev + 1;
        });
    };

    // Display loading screen while database is not ready
    if (!db) {
        return (
            <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#FAFAF7'
            }}>
                <CircularProgress sx={{ color: '#43302E', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#43302E' }}>
                    Loading database...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            flexGrow: 1,
            minHeight: '100vh',
            backgroundColor: '#FAFAF7'
        }}>
            {/* Application header */}
            <AppHeader />

            {/* Navigation tabs for switching between pages */}
            <Box sx={{ 
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid rgba(193, 219, 232, 0.3)'
            }}>
                <Container maxWidth="xl">
                    <Tabs 
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="navigation tabs"
                    >
                        <Tab label="Add Cost" />
                        <Tab label="Report" />
                        <Tab label="Pie Chart" />
                        <Tab label="Bar Chart" />
                        <Tab label="Settings" />
                    </Tabs>
                </Container>
            </Box>

            {/* Render content based on selected tab */}
            <TabPanel value={tabValue} index={0}>
                <AddCost db={db} onCostAdded={handleCostAdded} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Report db={db} key={refreshKey} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <PieChart db={db} key={refreshKey} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <BarChart db={db} key={refreshKey} />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
                <Settings />
            </TabPanel>
        </Box>
    );
}

// Export main application component
export default App;
