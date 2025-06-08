import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
	Container, 
	Typography, 
	Box,
	Button,
	TextField,
	Paper, 
	List, 
	ListItem, 
	ListItemText, 
	Chip,
	Snackbar,
	Alert,
	Input,
	Modal
} from '@mui/material';
import './App.css';

interface Report { // Define the type for reports
	id: number;
	location: string;
	incident: string;
	date_reported: string;
	status: 'Received' | 'Acknowledged' | 'Fixed';
	image?: string;
}

class ReportFactory { // Factory class to provide a single consistent way to create reports
	static createReport(
		id: number,
		data: Report
 	) {
		return {
			id,
			location: data.location,
			incident: data.incident,
			date_reported: data.date_reported,
			status: data.status,
			image: data.image || ''
		}
	}
}

function App() {
	const endpoint = 'http://localhost:5050/api/reports';
	const [title, setTitle] = useState('Leak Detection and Reporting System');
	const [selectedPage, setSelectedPage] = useState(0);
	const [reports, setReports] = useState<Report[]>([]);
	const [location, setLocation] = useState('');
	const [incident, setIncident] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [openSnackbar, setOpenSnackbar] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedReport, setSelectedReport] = useState<Report | null>(null);

	useEffect(() => {
		const fetchReports = async () => {
			const response = await axios.get(endpoint);
			if (response.status === 200) {
				setReports(response.data);
			}else {
				setError('Failed to fetch reports. Please try again later.');
				setOpenSnackbar(true);
				console.error('Error fetching reports:', response);
			}
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

		
		const imageInput = document.getElementById('image-upload') as HTMLInputElement; // check if image is uploaded
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
		if (file.size > 10 * 1024 * 1024) { // 10MB file limit
			setError('Image size exceeds 10MB. Please upload a smaller image.');
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
		const newReportFactory = ReportFactory.createReport(reports.length + 1, newReport);// use factory to create new report for consistency

		try {
			const updatedReports = [...reports, newReportFactory];

			await axios.post(endpoint, newReportFactory); // make POST request to backend
			
			setSuccess('Report submitted successfully!');
			setOpenSnackbar(true);
			
			setReports(updatedReports);
			clearForm(); // Clear form after submission
			setSelectedPage(2); // Navigate to success page
			setTitle('Submission Complete');
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
		setTitle('Leak Detection and Reporting System');
	}

	const getFilteredReports = () => {
		if (selectedPage === 0) return reports; // All reports
		
		const statusFilter = ['', 'received', 'acknowledged', 'fixed'][selectedPage];
		return reports.filter(report => report.status === statusFilter);
	};
	
	const handleOpenReportDetails = (report: Report) => { // handle opening the modal with details
		setSelectedReport(report);
		setModalOpen(true);
	};

	const handleCloseModal = () => { // Function to close the modal
		setModalOpen(false);
		setSelectedReport(null);
	};

	const renderListItem = (report: Report) => ( // Update the list item rendering to include click handler
		<ListItem 
			key={report.id} 
			divider 
			onClick={() => handleOpenReportDetails(report)}
			sx={{ 
				cursor: 'pointer',
				transition: 'all 0.2s',
				mb: 1,
				'&:hover': {
					backgroundColor: 'rgba(0, 0, 0, 0.04)',
					transform: 'translateY(-2px)'
				},
				borderRadius: 1,
				boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
				'&:active': {
					transform: 'translateY(0)'
				}
			}}
		>
			<ListItemText
				primary={`#${report.id} - ${report.location}`}
				secondary={`Incident: ${report.incident}`}
			/>
			<Box sx={{ display: 'flex', flexDirection: 'column'}}>
				<Chip
					label={report.status}
					color={getStatusColor(report.status) as any}
					size="small"
					variant="outlined"
				/>
				<Typography style={{ textAlign: 'center' }}>
					{`${new Date(report.date_reported).toLocaleDateString()}`}
				</Typography>
			</Box>
		</ListItem>
	);

	const reportDetailsModal = (// Modal component for displaying report details
		<Modal
			open={modalOpen}
			onClose={handleCloseModal}
			aria-labelledby="report-details-modal"
		>
			<Box sx={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				width: '90%',
				maxWidth: 700,
				bgcolor: 'background.paper',
				boxShadow: 24,
				p: 4,
				borderRadius: 2,
				maxHeight: '90vh',
				overflow: 'auto',
			}}>
				{selectedReport && (
					<>
						<Typography variant="h5" component="h2" gutterBottom>
							Report #{selectedReport.id}
						</Typography>
						
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
							{selectedReport.image ? (
								<Box sx={{ width: '100%', maxHeight: '500px', overflow: 'hidden', mb: 3 }}>
									<img 
										src={selectedReport.image} 
										alt={`Incident at ${selectedReport.location}`}
										style={{ width: '100%', objectFit: 'contain', maxHeight: '500px' }}
									/>
								</Box>
							) : (
								<Box sx={{ 
									width: '100%', 
									height: '300px', 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center',
									bgcolor: 'grey.200',
									mb: 3
								}}>
									<Typography variant="h1" color="text.secondary">🖼️</Typography>
								</Box>
							)}
							
							<Paper elevation={1} sx={{ p: 3, width: '100%' }}>
								<Typography variant="subtitle1" fontWeight="bold">Location:</Typography>
								<Typography variant="body1" paragraph>{selectedReport.location}</Typography>
								
								<Typography variant="subtitle1" fontWeight="bold">Incident:</Typography>
								<Typography variant="body1" paragraph>{selectedReport.incident}</Typography>
								
								<Typography variant="subtitle1" fontWeight="bold">Status:</Typography>
								<Chip
									label={selectedReport.status}
									color={getStatusColor(selectedReport.status) as any}
									size="small"
									sx={{ mt: 1 }}
								/>
								
								<Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Reported:</Typography>
								<Typography variant="body1">
									{new Date(selectedReport.date_reported).toLocaleDateString()}
								</Typography>
							</Paper>
						</Box>
						
						<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
							<Button variant="contained" onClick={handleCloseModal}>
								Close
							</Button>
						</Box>
					</>
				)}
			</Box>
		</Modal>
	);

	if (reports.length === 0) {
		return (
			<Container maxWidth="md" sx={{ mt: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom align='center'>
					{ title }
				</Typography>
				<Typography variant="body1" align='center'>
					No Reports Available. Please add a new report.
				</Typography>
			</Container>
		);
	}

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
								renderListItem(report)
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
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
					/>
					
					<Box sx={{ mt: 2, mb: 2 }}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Image</Typography>
						<Input
							type="file"
							inputProps={{
								accept: "image/jpeg, image/jpg, image/png",
								id: "image-upload"
							}}
							fullWidth
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIncident(e.target.value)}
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
		<>
			{
				selectedPage === 2 && (
					<Box sx={{ 
						display: 'flex', 
						flexDirection: 'column', 
						alignItems: 'center', 
						justifyContent: 'center', 
						textAlign: 'center',
						mt: 5,
						p: 4
					}}>
						<Paper elevation={3} sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 500 }}>
							<Box 
								sx={{ 
									width: 100, 
									height: 100, 
									borderRadius: '50%', 
									bgcolor: 'success.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									mb: 3
								}}
							>
								<Typography variant="h2" color="white" sx={{ fontSize: 60 }}>✓</Typography>
							</Box>
							<Typography variant="h5" sx={{ mb: 3 }}>
								Your report has been successfully submitted and will be reviewed shortly.
							</Typography>
							<Button
								variant="contained"
								color="primary"
								onClick={() => {
									setSelectedPage(0);
									setTitle('Leak Detection and Reporting System');
								}}
							>
								Return Home
							</Button>
						</Paper>
					</Box>
				)
			}
		</>
		{
			modalOpen && reportDetailsModal
		}
	</Container>
  )
}

export default App;
