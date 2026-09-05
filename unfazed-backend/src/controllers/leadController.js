import Lead from "../models/Lead.js";
import Therapist from "../models/Therapist.js";

export const createLead = async (req, res, next) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      source,
      notes,
    } = req.body;

    if (!clientName) {
      return res.status(400).json({
        success: false,
        message: "Client name is required",
      });
    }

    const therapist = await Therapist.findById(req.user.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const lead = await Lead.create({
      clientName,
      clientEmail,
      clientPhone,
      therapist: therapist._id,
      source: source || "manual",
      notes,
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({
      therapist: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    }).populate("convertedClient", "name email phone");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.status(200).json({
      success: true,
      lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const {
      clientName,
      clientEmail,
      clientPhone,
      source,
      status,
      notes,
    } = req.body;

    const allowedStatuses = [
      "new",
      "contacted",
      "qualified",
      "converted",
      "lost",
    ];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead status",
      });
    }

    if (clientName !== undefined) lead.clientName = clientName;
    if (clientEmail !== undefined) lead.clientEmail = clientEmail;
    if (clientPhone !== undefined) lead.clientPhone = clientPhone;
    if (source !== undefined) lead.source = source;
    if (status !== undefined) lead.status = status;
    if (notes !== undefined) lead.notes = notes;

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};