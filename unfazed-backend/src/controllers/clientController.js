import bcrypt from "bcryptjs";
import Client from "../models/Client.js";
import Session from "../models/Session.js";
import Payment from "../models/Payment.js";

export const getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({
      therapist: req.user.id,
    }).select("-password");

    const clientsWithLastSession = await Promise.all(
      clients.map(async (client) => {
        const lastSession = await Session.findOne({
          therapist: req.user.id,
          client: client._id,
          status: {
            $in: [
              "completed",
              "confirmed",
              "scheduled",
              "no_show",
            ],
          },
        })
          .sort({ startTime: -1 })
          .select("startTime endTime status");

        return {
          ...client.toObject(),
          lastSession: lastSession || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: clientsWithLastSession.length,
      clients: clientsWithLastSession,
    });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    }).select("-password");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const {
  name,
  email,
  password,
  phone,
  avatar,
  dateOfBirth,
  gender,
  languages,
  tags,
  intake,
  consent,
} = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingClient = await Client.findOne({
      therapist: req.user.id,
      email: email.toLowerCase(),
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: "Client with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const normalizedConsent =
  consent?.given === true
    ? {
        given: true,
        givenAt: new Date(),
      }
    : {
        given: false,
      };

const client = await Client.create({
  therapist: req.user.id,
  name,
  email: email.toLowerCase(),
  password: hashedPassword,
  phone,
  avatar,
  dateOfBirth,
  gender,
  languages,
  tags,
  intake,
  consent: normalizedConsent,
});

    const clientResponse = client.toObject();
    delete clientResponse.password;

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client: clientResponse,
    });
  } catch (error) {
    next(error);
  }
};

// New function to update client details
export const updateClient = async (req, res, next) => {
  try {
    const {
       name,
       email,
       password,
       phone,
       avatar,
       dateOfBirth,
       gender,
       languages,
       tags,
       intake,
       consent,
    } = req.body;

    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    }).select("+password");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (name !== undefined) {
      client.name = name;
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase();

      const existingClient = await Client.findOne({
        therapist: req.user.id,
        email: normalizedEmail,
        _id: { $ne: req.params.id },
      });

      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: "Client with this email already exists",
        });
      }

      client.email = normalizedEmail;
    }

    if (password !== undefined) {
      client.password = await bcrypt.hash(password, 10);
    }

    if (phone !== undefined) {
      client.phone = phone;
    }

    if (avatar !== undefined) {
      client.avatar = avatar;
    }

    if (dateOfBirth !== undefined) {
      client.dateOfBirth = dateOfBirth;
    }

    if (gender !== undefined) {
      client.gender = gender;
    }

    if (languages !== undefined) {
      client.languages = languages;
    }

    if (tags !== undefined) {
      client.tags = tags;
    }

    if (intake !== undefined) {
      client.intake = intake;
    }

    if (consent !== undefined) {
     client.consent =
       consent?.given === true
      ? {
          given: true,
          givenAt: new Date(),
        }
      : {
          given: false,
        };
    }

    await client.save();

    const clientResponse = client.toObject();
    delete clientResponse.password;

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client: clientResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
