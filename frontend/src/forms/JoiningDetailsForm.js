import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, Paper, MenuItem, FormControl, InputLabel, Select, FormHelperText } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from "../api/axiosInstance";
import { toast } from 'react-toastify';
import { toISODate, fromISODate, monthNames } from '../utils/dateFormatter';

const days = Array.from({length: 31}, (_, i) => i + 1);
const months = monthNames;
const years = Array.from({length: 50}, (_, i) => new Date().getFullYear() - i);

// Department options
const departmentOptions = [
  'Software Development',
  'Software Testing',
  'DevOps',
  'Human Resource'
];

// Designation options based on department
const designationsByDepartment = {
  'Software Development': [
    'Associate Software Developer',
    'Senior Software Developer',
    'Team Lead - Software Development',
    'Manager - Software Development'
  ],
  'Software Testing': [
    'Associate Test Engineer',
    'Senior Test Engineer',
    'Team Lead - Testing',
    'Manager - Testing'
  ],
  'DevOps': [
    'Associate DevOps Engineer',
    'Senior DevOps Engineer',
    'Team Lead - DevOps',
    'Manager - DevOps'
  ],
  'Human Resource': [
    'Associate HR Executive',
    'Senior HR Executive',
    'Team Lead - HR',
    'Manager - HR'
  ]
};

// Mode of recruitment options
const modeOfRecruitmentOptions = [
  'Online',
  'Offline'
];

// Employee type options
const employeeTypeOptions = [
  'Permanent',
  'Contract',
  'Part Time'
];

const JoiningDetailsForm = ({ nextStep, prevStep, handleFormDataChange, savedJoiningDetails, employeeId, savedData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = savedData || savedJoiningDetails || {
    appointmentDay: '',
    appointmentMonth: '',
    appointmentYear: '',
    department: '',
    joiningDay: '',
    joiningMonth: '',
    joiningYear: '',
    initialDesignation: '',
    modeOfRecruitment: '',
    employeeType: ''
  };

  const validationSchema = Yup.object().shape({
    appointmentDay: Yup.number().required('Appointment day is required'),
    appointmentMonth: Yup.string().required('Appointment month is required'),
    appointmentYear: Yup.number().required('Appointment year is required'),
    department: Yup.string().required('Department is required'),
    joiningDay: Yup.number().required('Joining day is required'),
    joiningMonth: Yup.string().required('Joining month is required'),
    joiningYear: Yup.number().required('Joining year is required'),
    initialDesignation: Yup.string().required('Initial designation is required'),
    modeOfRecruitment: Yup.string().required('Mode of recruitment is required'),
    employeeType: Yup.string().required('Employee type is required'),
    
    // Custom validation to ensure joining date is on or after appointment date
    joiningDate: Yup.mixed().test(
      'joining-after-appointment',
      'Date of joining must be on or after date of appointment',
      function(value) {
        const { appointmentDay, appointmentMonth, appointmentYear, joiningDay, joiningMonth, joiningYear } = this.parent;
        
        if (appointmentDay && appointmentMonth && appointmentYear && joiningDay && joiningMonth && joiningYear) {
          const appUTC = Date.UTC(appointmentYear, months.indexOf(appointmentMonth), appointmentDay);
          const joinUTC = Date.UTC(joiningYear, months.indexOf(joiningMonth), joiningDay);
          
          return joinUTC >= appUTC;
        }
        return true;
      }
    )
  });

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      
      // Create ISO date strings (YYYY-MM-DD) to avoid timezone issues
      const appointmentDate = toISODate(
        values.appointmentYear,
        values.appointmentMonth,
        values.appointmentDay
      );
      
      const joiningDate = toISODate(
        values.joiningYear,
        values.joiningMonth,
        values.joiningDay
      );
      
      const formData = {
        dateOfAppointment: appointmentDate,
        dateOfJoining: joiningDate,
        department: values.department,
        initialDesignation: values.initialDesignation,
        modeOfRecruitment: values.modeOfRecruitment,
        employeeType: values.employeeType
      };
    
      console.log('Request payload:', {
        employeeId,
        formData
      });
    
      const response = await api.post(
        'employees/joining-details',
        {
          employeeId,
          formData
        },
        {
          headers: { 
            'Content-Type': 'application/json',
          }
        }
      );
    
      console.log('Server response:', response.data);
    
      if (response.data.success) {
        console.log('Joining details saved successfully:', response.data);
        toast.success('Joining details saved successfully');
        nextStep();
      }
    } catch (error) {
      console.log('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to save joining details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom color="primary">
        Joining Details
      </Typography>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ errors, touched, values, setFieldValue, isValid }) => (
          <Form>
            <Grid container spacing={3}>
              {/* Date of Appointment */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: '600', color: '#333' }}>
                  Date of Appointment*
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth error={errors.appointmentDay && (touched.appointmentDay || values.appointmentDay)}>
                      <InputLabel>Day*</InputLabel>
                      <Field name="appointmentDay">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Day"
                            onChange={(e) => {
                              form.setFieldValue('appointmentDay', e.target.value);
                              const newDate = new Date(
                                form.values.appointmentYear,
                                months.indexOf(form.values.appointmentMonth),
                                e.target.value
                              );
                              form.setFieldValue('dateOfAppointment', newDate);
                            }}
                          >
                            <MenuItem value="">Select Day</MenuItem>
                            {days.map(day => (
                              <MenuItem key={day} value={day}>{day}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.appointmentDay && (touched.appointmentDay || values.appointmentDay) && (
                        <FormHelperText>{errors.appointmentDay}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <FormControl fullWidth error={errors.appointmentMonth && (touched.appointmentMonth || values.appointmentMonth)}>
                      <InputLabel>Month*</InputLabel>
                      <Field name="appointmentMonth">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Month"
                            onChange={(e) => {
                              form.setFieldValue('appointmentMonth', e.target.value);
                              const newDate = new Date(
                                form.values.appointmentYear,
                                months.indexOf(e.target.value),
                                form.values.appointmentDay
                              );
                              form.setFieldValue('dateOfAppointment', newDate);
                            }}
                          >
                            <MenuItem value="">Select Month</MenuItem>
                            {months.map(month => (
                              <MenuItem key={month} value={month}>{month}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.appointmentMonth && (touched.appointmentMonth || values.appointmentMonth) && (
                        <FormHelperText>{errors.appointmentMonth}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <FormControl fullWidth error={errors.appointmentYear && (touched.appointmentYear || values.appointmentYear)}>
                      <InputLabel>Year*</InputLabel>
                      <Field name="appointmentYear">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Year"
                            onChange={(e) => {
                              form.setFieldValue('appointmentYear', e.target.value);
                              const newDate = new Date(
                                e.target.value,
                                months.indexOf(form.values.appointmentMonth),
                                form.values.appointmentDay
                              );
                              form.setFieldValue('dateOfAppointment', newDate);
                            }}
                          >
                            <MenuItem value="">Select Year</MenuItem>
                            {years.map(year => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.appointmentYear && (touched.appointmentYear || values.appointmentYear) && (
                        <FormHelperText>{errors.appointmentYear}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Date of Joining */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: '600', color: '#333' }}>
                  Date of Joining*
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth error={errors.joiningDay && (touched.joiningDay || values.joiningDay)}>
                      <InputLabel>Day*</InputLabel>
                      <Field name="joiningDay">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Day"
                            onChange={(e) => {
                              form.setFieldValue('joiningDay', e.target.value);
                              const newDate = new Date(
                                form.values.joiningYear,
                                months.indexOf(form.values.joiningMonth),
                                e.target.value
                              );
                              form.setFieldValue('dateOfJoining', newDate);
                              
                              // Trigger validation for date comparison
                              form.setFieldValue('joiningDate', newDate);
                            }}
                          >
                            <MenuItem value="">Select Day</MenuItem>
                            {days.map(day => (
                              <MenuItem key={day} value={day}>{day}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.joiningDay && (touched.joiningDay || values.joiningDay) && (
                        <FormHelperText>{errors.joiningDay}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <FormControl fullWidth error={errors.joiningMonth && (touched.joiningMonth || values.joiningMonth)}>
                      <InputLabel>Month*</InputLabel>
                      <Field name="joiningMonth">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Month"
                            onChange={(e) => {
                              form.setFieldValue('joiningMonth', e.target.value);
                              const newDate = new Date(
                                form.values.joiningYear,
                                months.indexOf(e.target.value),
                                form.values.joiningDay
                              );
                              form.setFieldValue('dateOfJoining', newDate);
                              
                              // Trigger validation for date comparison
                              form.setFieldValue('joiningDate', newDate);
                            }}
                          >
                            <MenuItem value="">Select Month</MenuItem>
                            {months.map(month => (
                              <MenuItem key={month} value={month}>{month}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.joiningMonth && (touched.joiningMonth || values.joiningMonth) && (
                        <FormHelperText>{errors.joiningMonth}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <FormControl fullWidth error={errors.joiningYear && (touched.joiningYear || values.joiningYear)}>
                      <InputLabel>Year*</InputLabel>
                      <Field name="joiningYear">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Year"
                            onChange={(e) => {
                              form.setFieldValue('joiningYear', e.target.value);
                              const newDate = new Date(
                                e.target.value,
                                months.indexOf(form.values.joiningMonth),
                                form.values.joiningDay
                              );
                              form.setFieldValue('dateOfJoining', newDate);
                              
                              // Trigger validation for date comparison
                              form.setFieldValue('joiningDate', newDate);
                            }}
                          >
                            <MenuItem value="">Select Year</MenuItem>
                            {years.map(year => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.joiningYear && (touched.joiningYear || values.joiningYear) && (
                        <FormHelperText>{errors.joiningYear}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
                
                {/* Date comparison error display */}
                {errors.joiningDate && (
                  <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                    {errors.joiningDate}
                  </Typography>
                )}
              </Grid>

              {/* Department */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={errors.department && (touched.department || values.department)}>
                  <InputLabel>Department*</InputLabel>
                  <Field name="department">
                    {({ field, form }) => (
                      <Select
                        {...field}
                        label="Department"
                        onChange={(e) => {
                          const selectedDepartment = e.target.value;
                          form.setFieldValue('department', selectedDepartment);
                          // Reset designation when department changes
                          form.setFieldValue('initialDesignation', '');
                        }}
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {departmentOptions.map(dept => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.department && (touched.department || values.department) && (
                    <FormHelperText>{errors.department}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Initial Designation */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={errors.initialDesignation && (touched.initialDesignation || values.initialDesignation)}>
                  <InputLabel>Initial Designation*</InputLabel>
                  <Field name="initialDesignation">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Initial Designation"
                        disabled={!values.department}
                      >
                        <MenuItem value="">Select Designation</MenuItem>
                        {values.department && designationsByDepartment[values.department]?.map(designation => (
                          <MenuItem key={designation} value={designation}>{designation}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.initialDesignation && (touched.initialDesignation || values.initialDesignation) && (
                    <FormHelperText>{errors.initialDesignation}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Mode of Recruitment */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={errors.modeOfRecruitment && (touched.modeOfRecruitment || values.modeOfRecruitment)}>
                  <InputLabel>Mode of Recruitment*</InputLabel>
                  <Field name="modeOfRecruitment">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Mode of Recruitment"
                      >
                        <MenuItem value="">Select Mode</MenuItem>
                        {modeOfRecruitmentOptions.map(mode => (
                          <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.modeOfRecruitment && (touched.modeOfRecruitment || values.modeOfRecruitment) && (
                    <FormHelperText>{errors.modeOfRecruitment}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Employee Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={errors.employeeType && (touched.employeeType || values.employeeType)}>
                  <InputLabel>Employee Type*</InputLabel>
                  <Field name="employeeType">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Employee Type"
                      >
                        <MenuItem value="">Select Type</MenuItem>
                        {employeeTypeOptions.map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.employeeType && (touched.employeeType || values.employeeType) && (
                    <FormHelperText>{errors.employeeType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={prevStep}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Next'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default JoiningDetailsForm;
