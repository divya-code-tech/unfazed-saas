import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Therapist from "../models/Therapist.js";
import Client from "../models/Client.js";

const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// Therapist registration
export const registerTherapist = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      languages,
      specializations,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingTherapist = await Therapist.findOne({
      email: email.toLowerCase(),
    });

    if (existingTherapist) {
      return res.status(409).json({
        success: false,
        message: "Therapist with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const therapist = await Therapist.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      languages,
      specializations,
      bookingSlug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    });

    const token = generateToken(therapist._id, "therapist");

    return res.status(201).json({
      success: true,
      message: "Therapist registered successfully",
      data: {
        therapist: {
          id: therapist._id,
          name: therapist.name,
          email: therapist.email,
          role: "therapist",
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Therapist login
export const loginTherapist = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const therapist = await Therapist.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!therapist) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      therapist.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    therapist.lastLoginAt = new Date();
    await therapist.save();

    const token = generateToken(therapist._id, "therapist");

    return res.status(200).json({
      success: true,
      message: "Therapist login successful",
      data: {
        therapist: {
          id: therapist._id,
          name: therapist.name,
          email: therapist.email,
          role: "therapist",
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Client registration
export const registerClient = async (req, res, next) => {
  try {
    const {
      therapistId,
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      languages,
      intake,
    } = req.body;

    if (!therapistId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Therapist, name, email and password are required",
      });
    }

    const therapist = await Therapist.findById(therapistId);

    if (!therapist || !therapist.isActive) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const existingClient = await Client.findOne({
      therapist: therapistId,
      email: email.toLowerCase(),
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: "Client with this email already exists for this therapist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const client = await Client.create({
      therapist: therapistId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      dateOfBirth,
      gender,
      languages,
      intake,
    });

    const token = generateToken(client._id, "client");

    return res.status(201).json({
      success: true,
      message: "Client registered successfully",
      data: {
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          therapist: client.therapist,
          role: "client",
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Client login
export const loginClient = async (req, res, next) => {
  try {
    const { email, password, therapistId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const query = {
      email: email.toLowerCase(),
    };

    if (therapistId) {
      query.therapist = therapistId;
    }

    const client = await Client.findOne(query).select("+password");

    if (!client) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      client.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    client.lastLoginAt = new Date();
    await client.save();

    const token = generateToken(client._id, "client");

    return res.status(200).json({
      success: true,
      message: "Client login successful",
      data: {
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          therapist: client.therapist,
          role: "client",
          mustChangePassword: client.mustChangePassword,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changeClientPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const client = await Client.findById(req.user.id).select("+password");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      client.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    client.password = await bcrypt.hash(newPassword, 12);
    client.mustChangePassword = false;

    await client.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
