import React, { useState, useEffect } from 'react';
import data from './data/reports.json';
import { 
	Container, 
	Typography, 
	Box, 
	Tabs, 
	Tab, 
	Button,
	TextField,
	Paper, 
	List, 
	ListItem, 
	ListItemText, 
	Chip,
	Snackbar,
	Alert
} from '@mui/material';
import './App.css';

// Define the type for reports
interface Report {
	id: number;
	location: string;
	incident: string;
	date_reported: string;
	status: 'Received' | 'Acknowledged' | 'Fixed';
	image?: string;
}

function App() {
	const [title, setTitle] = useState('Leak Detection and Reporting System');
	const [selectedPage, setSelectedPage] = useState(0);
	const [reports, setReports] = useState<Report[]>([]);
	const [location, setLocation] = useState('');
	const [incident, setIncident] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [openSnackbar, setOpenSnackbar] = useState(false);

	useEffect(() => {
		const fetchReports = async () => {
			setReports(data.reports as Report[]);
		}
		fetchReports();
	}, []);

	const getStatusColor = (status: string) => {
		switch(status) {
		case 'Received': return 'default';
		case 'Acknowledged': return 'primary';
		case 'Fixed': return 'success';
		default: return 'default';
		}
	};

	const handleSubmitReport = async () => {
		setError(null);
		setOpenSnackbar(false);
		if (!location || !incident) {
			setError('Location and Incident Description are required.');
			setOpenSnackbar(true);
			return;
		}

		// check if image is uploaded
		const imageInput = document.getElementById('image-upload') as HTMLInputElement;
		if (!imageInput.files || imageInput.files.length === 0) {
			setError('Please upload an image.');
			setOpenSnackbar(true);
			return;
		}
		const file = imageInput.files[0];
		if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
			setError('Invalid image format. Please upload JPG or PNG.');
			setOpenSnackbar(true);
			return;
		}
		if (file.size > 2 * 1024 * 1024) { // 2MB limit
			setError('Image size exceeds 2MB. Please upload a smaller image.');
			setOpenSnackbar(true);
			return;
		}
		let imageBase64 = '';
		if (file) {
			try {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				imageBase64 = await new Promise((resolve, reject) => {
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = (error) => reject(error);
				});
			} catch (err) {
				console.error('Error reading file:', err);
				setError('Failed to read image file. Please try again.');
				setOpenSnackbar(true);
				return;
			}
		}

		const newReport: Report = {
			id: reports.length + 1,
			location,
			incident,
			date_reported: new Date().toISOString(),
			status: 'Received',
			image: imageBase64
		};

		try {
			const updatedReports = [...reports, newReport];

			const jsonBlob = new Blob([JSON.stringify({ reports: updatedReports }, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(jsonBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = './data/reports.json';
			a.click();
			URL.revokeObjectURL(url);
			
			setSuccess('Report submitted successfully!');
			setOpenSnackbar(true);
			
			setReports(updatedReports);
			clearForm(); // Clear form after submission
		} catch (err) {
			console.error('Error submitting report:', err);
			setError('Failed to submit report. Please try again.');
			setOpenSnackbar(true);
		}
	}

	const clearForm = () => {
		setLocation('');
		setIncident('');
		setError(null);
		setSuccess(null);
		setOpenSnackbar(false);
		setSelectedPage(0); // Reset to All Reports view
		setTitle('Leak Detection and Reporting System');
	}

  const getFilteredReports = () => {
    if (selectedPage === 0) return reports; // All reports
    
    const statusFilter = ['', 'received', 'acknowledged', 'fixed'][selectedPage];
    return reports.filter(report => report.status === statusFilter);
  };

  return (
	<Container maxWidth="md" sx={{ mt: 4 }}>
		<Typography variant="h4" component="h1" gutterBottom align='center'>
			{ title }
		</Typography>
		
		<>
			{
				selectedPage === 0 && (
					<>
						<Paper elevation={2}>
							<List>
							{getFilteredReports().length > 0 ? (
								getFilteredReports().map(report => (
								<ListItem key={report.id} divider>
									<ListItemText
										primary={`#${report.id} - ${report.location}`}
										secondary={`Incident: ${report.incident}`}
									/>
									<div style={{ display: 'flex', flexDirection: 'column'}}>
										<Chip
										label={report.status}
										color={getStatusColor(report.status) as any}
										size="small"
										variant="outlined"
										/>
										<span style={{ textAlign: 'center' }}>{`${new Date(report.date_reported).toLocaleDateString()}`}</span>
									</div>
								</ListItem>
								))
							) : (
								<ListItem>
								<ListItemText primary="No reports found" />
								</ListItem>
							)}
							</List>
						</Paper>
						<Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
							<Button
								variant="contained"
								color="primary"
								onClick={() => {
									setSelectedPage(1); // Navigate to Add New Report page
									setTitle('Add New Report');
								}}
							>
								Add New Report
							</Button>
						</Box>
					</>
				)
			}
		</>
		<>
			{selectedPage === 1 && (
				<Paper elevation={3} sx={{ mt: 3, p: 3 }}>
					<Typography variant="h6" gutterBottom>Add New Report</Typography>
					
					<TextField
						label="Location"
						fullWidth
						margin="normal"
						value={location}
						onChange={(e) => setLocation(e.target.value)}
					/>
					
					<Box sx={{ mt: 2, mb: 2 }}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Image</Typography>
						<input
							accept="image/jpeg, image/jpg, image/png"
							id="image-upload"
							type="file"
							style={{ width: '100%' }}
							onChange={(e) => {
								if (e.target.files && e.target.files.length > 0) {
									setError(null); // Clear error if file is selected
								}
							}}
						/>
						<Typography variant="caption" color="textSecondary">
							Accepted formats: JPG, JPEG, PNG
						</Typography>
					</Box>
					
					<TextField
						label="Incident Description"
						fullWidth
						margin="normal"
						multiline
						rows={4}
						value={incident}
						onChange={(e) => setIncident(e.target.value)}
					/>
					
					<Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
						<Button
							variant="contained"
							color="primary"
							onClick={handleSubmitReport}
						>
							Submit Report
						</Button>
						<Button 
							variant="outlined"
							onClick={() => {
								setSelectedPage(0); // Navigate back to All Reports
								setTitle('Leak Detection and Reporting System');
							}}
						>
							Cancel
						</Button>
					</Box>
				{
					(error || success) && (
						<Snackbar 
							open={error !== null && openSnackbar} 
							autoHideDuration={6000} 
							onClose={() => setOpenSnackbar(false)}
						>
							<Alert 
								onClose={() => setOpenSnackbar(false)} 
								severity={error ? 'error' : 'success'}
								sx={{ width: '100%' }}
							>
								{error || success}
							</Alert>
						</Snackbar>
					)
				}
				</Paper>
			)}
		</>
	</Container>
  )
}

export default App;
