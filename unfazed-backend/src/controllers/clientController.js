import Client from "../models/Client.js";

export const getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({
      therapist: req.user.id,
    }).select("-password");

    res.status(200).json({
      success: true,
      count: clients.length,
      clients,
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
      intake,
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

    const client = await Client.create({
      therapist: req.user.id,
      name,
      email: email.toLowerCase(),
      password,
      phone,
      avatar,
      dateOfBirth,
      gender,
      languages,
      intake,
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
