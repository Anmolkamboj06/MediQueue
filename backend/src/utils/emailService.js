const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer Transporter using environment variables
 */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

/**
 * Helper to dispatch mail with error trapping
 */
const sendMail = async (mailOptions) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
            console.warn("Email service: EMAIL_USER or EMAIL_APP_PASSWORD is not set. Email not sent.");
            return { success: false, reason: "Missing email credentials" };
        }

        const info = await transporter.sendMail({
            from: `"Patient Queue System" <${process.env.EMAIL_USER}>`,
            ...mailOptions
        });

        console.log(`Email successfully sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Email service error:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email to newly registered staff/patient
 * @param {string} to 
 * @param {string} name 
 */
const sendWelcomeEmail = async (to, name) => {
    const mailOptions = {
        to,
        subject: "Welcome to Patient Queue Management System",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2b6cb0;">Welcome to Patient Queue Management</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Welcome to our hospital management portal. Your account has been registered successfully.</p>
                <p>You can now log in to manage your appointments, view queues, and access medical services seamlessly.</p>
                <div style="margin: 25px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #3182ce; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Open Portal
                    </a>
                </div>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                <p style="color: #718096; font-size: 12px;">This is an automated notification. Please do not reply directly to this email.</p>
            </div>
        `
    };

    return await sendMail(mailOptions);
};

/**
 * Send appointment confirmation email
 * @param {string} to 
 * @param {object} appointmentDetails 
 */
const sendAppointmentConfirmation = async (to, appointmentDetails) => {
    const {
        patientName,
        doctorName,
        department,
        appointmentDate,
        appointmentTime,
        status = "Scheduled"
    } = appointmentDetails;

    const mailOptions = {
        to,
        subject: `Appointment Confirmed - Dr. ${doctorName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2b6cb0;">Appointment Confirmation</h2>
                <p>Dear <strong>${patientName || 'Patient'}</strong>,</p>
                <p>Your appointment has been successfully scheduled. Below are the details:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; width: 40%;">Doctor:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">Dr. ${doctorName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold;">Department:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${department}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold;">Date:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${appointmentDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold;">Time:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${appointmentTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold;">Status:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #edf2f7; color: #38a169; font-weight: bold;">${status}</td>
                    </tr>
                </table>

                <p>Please arrive at the clinic 15 minutes before your scheduled appointment.</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                <p style="color: #718096; font-size: 12px;">If you need to reschedule or cancel, please contact reception or visit your portal.</p>
            </div>
        `
    };

    return await sendMail(mailOptions);
};

/**
 * Send queue status notification
 * @param {string} to 
 * @param {object} queueDetails 
 */
const sendQueueNotification = async (to, queueDetails) => {
    const {
        patientName,
        queueNumber,
        status,
        doctorName,
        department,
        estimatedWaitTime
    } = queueDetails;

    const mailOptions = {
        to,
        subject: `Queue Update: Token #${queueNumber} (${status})`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2b6cb0;">Queue Status Notification</h2>
                <p>Hello <strong>${patientName || 'Patient'}</strong>,</p>
                <p>Your queue token status has been updated:</p>

                <div style="text-align: center; margin: 25px 0; background: #ebf8ff; padding: 20px; border-radius: 8px;">
                    <span style="font-size: 14px; color: #4a5568; display: block;">YOUR TOKEN NUMBER</span>
                    <span style="font-size: 38px; font-weight: bold; color: #2b6cb0; display: block; margin: 5px 0;">#${queueNumber}</span>
                    <span style="display: inline-block; padding: 4px 12px; background: #bee3f8; color: #2c5282; border-radius: 12px; font-weight: bold; text-transform: uppercase;">
                        Status: ${status}
                    </span>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    ${doctorName ? `<tr><td style="padding: 6px; font-weight: bold;">Doctor:</td><td style="padding: 6px;">Dr. ${doctorName}</td></tr>` : ''}
                    ${department ? `<tr><td style="padding: 6px; font-weight: bold;">Department:</td><td style="padding: 6px;">${department}</td></tr>` : ''}
                    ${estimatedWaitTime ? `<tr><td style="padding: 6px; font-weight: bold;">Estimated Wait:</td><td style="padding: 6px;">${estimatedWaitTime}</td></tr>` : ''}
                </table>

                <p>Please remain in the waiting area. Watch the live display monitor for your turn.</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                <p style="color: #718096; font-size: 12px;">Automated message from Hospital Queue Management.</p>
            </div>
        `
    };

    return await sendMail(mailOptions);
};

module.exports = {
    transporter,
    sendWelcomeEmail,
    sendAppointmentConfirmation,
    sendQueueNotification
};
