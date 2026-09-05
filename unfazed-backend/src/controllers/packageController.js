import Package from "../models/Package.js";

export const createPackage = async (req, res, next) => {
  try {
    const {
      name,
      description,
      sessionCount,
      sessionDuration,
      price,
      currency,
      validityDays,
      isActive,
    } = req.body;

    if (
      !name ||
      sessionCount === undefined ||
      sessionDuration === undefined ||
      price === undefined ||
      validityDays === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, session count, session duration, price and validity days are required",
      });
    }

    const packageData = await Package.create({
      therapist: req.user.id,
      name,
      description,
      sessionCount,
      sessionDuration,
      price,
      currency: currency || "INR",
      validityDays,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: packageData,
    });
  } catch (error) {
    next(error);
  }
};

export const getPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({
      therapist: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: packages.length,
      packages,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const packageData = await Package.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    const {
      name,
      description,
      sessionCount,
      sessionDuration,
      price,
      currency,
      validityDays,
      isActive,
    } = req.body;

    if (name !== undefined) packageData.name = name;
    if (description !== undefined) packageData.description = description;
    if (sessionCount !== undefined) packageData.sessionCount = sessionCount;
    if (sessionDuration !== undefined) {
      packageData.sessionDuration = sessionDuration;
    }
    if (price !== undefined) packageData.price = price;
    if (currency !== undefined) packageData.currency = currency;
    if (validityDays !== undefined) {
      packageData.validityDays = validityDays;
    }
    if (isActive !== undefined) packageData.isActive = isActive;

    await packageData.save();

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      package: packageData,
    });
  } catch (error) {
    next(error);
  }
};
export const deletePackage = async (req, res, next) => {
  try {
    const packageData = await Package.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    await packageData.deleteOne();

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};