import { mailtrapClient, sender } from './mailtrap.config.js';
import { VERIFICATION_EMAIL_TEMPLATE } from './emailTemplate.js';

export const sendVerificationEmail = async (email, verificationToken) => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
			category: "Email Verification",
		});

		//console.log("Email sent successfully", response);
	} catch (error) {
		//console.error(`Error sending verification`, error);

		throw new Error(`Error sending verification email: ${error}`);
	}
};

export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{ email }];

    try {

        const response =  await mailtrapClient.send({
            from: sender,
            to: recipient,
            template_uuid: "e6e63abf-0308-41ae-88b2-e0146fe768d2",
            template_variables: {
                "company_info_name": "Spectra",
                "name": name
            },
        });

        console.log("Welcome email sent successfully", response);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
}