import ClientPackage from "../models/ClientPackage.js";
import Client from "../models/Client.js";
import Package from "../models/Package.js";

export const createClientPackage = async (req, res, next) => {
  try {
    const { clientId, packageId } = req.body;

    if (!clientId || !packageId) {
      return res.status(400).json({
        success: false,
        message: "Client ID and package ID are required",
      });
    }

    // Make sure the client belongs to the authenticated therapist
    const client = await Client.findOne({
      _id: clientId,
      therapist: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Make sure the package belongs to the authenticated therapist
    const packageData = await Package.findOne({
      _id: packageId,
      therapist: req.user.id,
      isActive: true,
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found or inactive",
      });
    }

    const purchasedAt = new Date();

    const expiresAt = new Date(purchasedAt);
    expiresAt.setDate(expiresAt.getDate() + packageData.validityDays);

    const clientPackage = await ClientPackage.create({
      client: clientId,
      therapist: req.user.id,
      package: packageId,
      sessionsPurchased: packageData.sessionCount,
      sessionsUsed: 0,
      purchasedAt,
      expiresAt,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Client package created successfully",
      clientPackage,
    });
  } catch (error) {
    next(error);
  }
};

export const getClientPackages = async (req, res, next) => {
  try {
    const clientPackages = await ClientPackage.find({
      therapist: req.user.id,
    })
      .populate("client", "name email phone")
      .populate(
        "package",
        "name description sessionCount sessionDuration price currency validityDays"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: clientPackages.length,
      clientPackages,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClientPackage = async (req, res, next) => {
  try {
    const clientPackage = await ClientPackage.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!clientPackage) {
      return res.status(404).json({
        success: false,
        message: "Client package not found",
      });
    }

    const { sessionsUsed, status } = req.body;

    if (sessionsUsed !== undefined) {
      if (sessionsUsed < 0) {
        return res.status(400).json({
          success: false,
          message: "Sessions used cannot be negative",
        });
      }

      if (sessionsUsed > clientPackage.sessionsPurchased) {
        return res.status(400).json({
          success: false,
          message:
            "Sessions used cannot be greater than sessions purchased",
        });
      }

      clientPackage.sessionsUsed = sessionsUsed;
    }

    if (status !== undefined) {
  const allowedStatuses = [
    "active",
    "expired",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid client package status",
    });
  }

  if (
    status === "completed" &&
    clientPackage.sessionsUsed < clientPackage.sessionsPurchased
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Client package cannot be completed until all sessions are used",
    });
  }

  clientPackage.status = status;
}
    

    await clientPackage.save();

    res.status(200).json({
      success: true,
      message: "Client package updated successfully",
      clientPackage,
    });
  } catch (error) {
    next(error);
  }
};

export const getClientPackageById = async (req, res, next) => {
  try {
    const clientPackage = await ClientPackage.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    })
      .populate("client", "name email phone")
      .populate(
        "package",
        "name description sessionCount sessionDuration price currency validityDays"
      );

    if (!clientPackage) {
      return res.status(404).json({
        success: false,
        message: "Client package not found",
      });
    }

    res.status(200).json({
      success: true,
      clientPackage,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelClientPackage = async (req, res, next) => {
  try {
    const clientPackage = await ClientPackage.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!clientPackage) {
      return res.status(404).json({
        success: false,
        message: "Client package not found",
      });
    }

    if (clientPackage.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active client packages can be cancelled",
      });
    }

    clientPackage.status = "cancelled";

    await clientPackage.save();

    res.status(200).json({
      success: true,
      message: "Client package cancelled successfully",
      clientPackage,
    });
  } catch (error) {
    next(error);
  }
};