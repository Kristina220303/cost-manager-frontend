import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { SUPPORTED_CURRENCIES } from '../utils/currencyConverter';
import { fetchExchangeRates, getExchangeRateURL } from '../utils/currencyConverter';
import PageLayout from './common/PageLayout';
import PrimaryCard from './common/PrimaryCard';

// Component displays detailed monthly expense reports in table format
// Supports currency conversion and automatic recalculation on currency change
function Report({ db }) {
    // State variables for report filters, data, and UI feedback
    // Tracks selected period, currency, and report generation status
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [currency, setCurrency] = useState('USD');
    const [report, setReport] = useState(null);
    const [originalCosts, setOriginalCosts] = useState(null);
    const [reportYear, setReportYear] = useState(null);
    const [reportMonth, setReportMonth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exchangeRates, setExchangeRates] = useState(null);

    // Loads exchange rates on component mount for currency conversion
    // Retrieves URL from settings or uses default server endpoint
    useEffect(function() {
        async function loadRates() {
            const url = getExchangeRateURL();
            const rates = await fetchExchangeRates(url);
            setExchangeRates(rates);
        }
        loadRates();
    }, []);

    // Automatically recalculates report when currency selection changes
    // Calls getReport again with new currency to get converted data
    useEffect(function() {
        if (originalCosts && exchangeRates && reportYear !== null && reportMonth !== null) {
            async function recalculateReport() {
                try {
                    const reportData = await db.getReport(reportYear, reportMonth, currency);
                    setReport(reportData);
                } catch (err) {
                    console.error('Failed to recalculate report:', err);
                }
            }
            recalculateReport();
        }
    }, [currency, exchangeRates, originalCosts, reportYear, reportMonth, db]);

    // Generates monthly report by querying database and converting currencies
    // Stores original costs for automatic recalculation when currency changes
    const handleGenerateReport = async function() {
        if (!exchangeRates) {
            setError('Exchange rates not loaded yet. Please wait...');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            // getReport now handles currency conversion internally
            const reportData = await db.getReport(year, month, currency);
            setOriginalCosts(reportData.costs);
            setReportYear(year);
            setReportMonth(month);
            
            // Report data is already converted to the selected currency
            setReport(reportData);
        } catch (err) {
            setError('Failed to generate report: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <PageLayout 
            title="Monthly Report"
            subtitle="View detailed expense reports for any month and year"
            maxWidth="lg"
        >
            <PrimaryCard sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#43302E' }}>
                    Filter Options
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <TextField
                        label="Year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        inputProps={{ min: 2000, max: 2100 }}
                        sx={{ minWidth: 120 }}
                    />
                    
                    <TextField
                        select
                        label="Month"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        sx={{ minWidth: 180 }}
                    >
                        {months.map(function(monthName, index) {
                            return (
                                <MenuItem key={index + 1} value={index + 1}>
                                    {monthName}
                                </MenuItem>
                            );
                        })}
                    </TextField>
                    
                    <TextField
                        select
                        label="Currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        {SUPPORTED_CURRENCIES.map(function(curr) {
                            return (
                                <MenuItem key={curr} value={curr}>
                                    {curr}
                                </MenuItem>
                            );
                        })}
                    </TextField>
                    
                    <Button
                        variant="contained"
                        onClick={handleGenerateReport}
                        disabled={loading || !exchangeRates}
                        sx={{
                            backgroundColor: '#43302E',
                            color: '#FFFFFF',
                            px: 4,
                            '&:hover': {
                                backgroundColor: '#2A1F1D'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
                    </Button>
                </Box>
            </PrimaryCard>
            
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}
            
            {/* Displays report table with all expense items for selected period */}
            {/* Shows date, category, description, and converted sum for each cost */}
            {report && (
                <PrimaryCard>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#43302E' }}>
                        Report for {months[month - 1]} {year}
                    </Typography>
                    
                    {report.costs.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Typography variant="body1" sx={{ color: '#6B5B58' }}>
                                No costs found for this period
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                Sum ({currency})
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {report.costs.map(function(cost, index) {
                                            return (
                                                <TableRow 
                                                    key={index}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(193, 219, 232, 0.05)'
                                                        }
                                                    }}
                                                >
                                                    <TableCell>{cost.Date.day}</TableCell>
                                                    <TableCell>{cost.category}</TableCell>
                                                    <TableCell>{cost.description}</TableCell>
                                                    <TableCell align="right">
                                                        {cost.sum.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            {/* Total summary chip showing converted total amount */}
                            {/* Displays at bottom of table with highlighted styling */}
                            <Box sx={{ 
                                mt: 4, 
                                display: 'flex', 
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                <Typography variant="body1" sx={{ color: '#6B5B58', fontWeight: 500 }}>
                                    Total:
                                </Typography>
                                <Chip
                                    label={`${report.total.total.toFixed(2)} ${report.total.currency}`}
                                    sx={{
                                        backgroundColor: '#FFF1B5',
                                        color: '#43302E',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        height: 40,
                                        px: 2
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </PrimaryCard>
            )}
        </PageLayout>
    );
}

export default Report;
