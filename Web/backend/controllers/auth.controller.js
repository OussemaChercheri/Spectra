import bcryptjs from 'bcryptjs';
import crypto from 'crypto';


import { generateVerficiationCode } from '../utils/generateVerficiationCode.js';
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from '../mailtrap/emails.js';
import { User } from '../models/user.model.js';

export const signup = async (req, res, next) => {
    const { email, password, name } = req.body;

    try {
        if(!email || !password || !name) {
            const error = new Error('All fields are required');
            error.statusCode = 400;
            throw error;
        }


        const userAlreadyExists = await User.findOne({email});
        if(userAlreadyExists) {
            const error = new Error('User already exists');
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = generateVerficiationCode();

        const user = await new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiredAt: Date.now() + 24 * 60 * 60 * 1000
        })

        await user.save();

        generateTokenAndSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined
            },
        });

    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    const { code } = req.body;
    try {
        console.log("Verification Code:", code);
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiredAt: { $gt: Date.now() },
        });



        if (!user) {
            const error = new Error("Invalid or expired verification code");
            error.statusCode = 400;
            throw error;
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiredAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if(!user) {
            const error = new Error('Invalid credentials');
            error.statusCode = 400;
            throw error;
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if(!isPasswordValid) {
            const error = new Error('Invalid credentials');
            error.statusCode = 400;
            throw error;
        }

        generateTokenAndSetCookie(res, user._id);
        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully"});
};

export const forgotPassword = async (req, res, next) => {

    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if(!user){
            const error = new Error("The user is invalid");
            error.statusCode = 400;
            throw error;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; //1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiredAt = resetTokenExpiresAt;

        await user.save();

        //send email
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset link sent to your email"});
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const {token} = req.params;
        const {password} = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiredAt: { $gt: Date.now() },
        });

        if(!user) {
            const error = new Error("Invalid or expired reset token");
            error.statusCode = 404;
            throw error;
        }

        // update password
        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiredAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({ success: true, message: "Password reset successful"});
    } catch (error) {
        next(error);
    }

};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			const error = new Error("User not found");
            error.statusCode = 400;
            throw error;
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		next(error);
	}
};