import Therapist from "../models/Therapist.js";

// Get the authenticated therapist's profile
export const getMyProfile = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.user.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    return res.status(200).json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        phone: therapist.phone,
        avatar: therapist.avatar,
        bio: therapist.bio,
        languages: therapist.languages,
        specializations: therapist.specializations,
        sessionDuration: therapist.sessionDuration,
        bufferTime: therapist.bufferTime,
        sessionPrice: therapist.sessionPrice,
        timezone: therapist.timezone,
        slug: therapist.slug,
        subscriptionTier: therapist.subscriptionTier,
        isActive: therapist.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update the authenticated therapist's profile
export const updateMyProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      avatar,
      bio,
      languages,
      specializations,
      sessionDuration,
      bufferTime,
      sessionPrice,
      timezone,
      slug,
    } = req.body;

    const therapist = await Therapist.findById(req.user.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      therapist.name = String(name).trim();
    }

    if (phone !== undefined) therapist.phone = phone;
    if (avatar !== undefined) therapist.avatar = avatar;
    if (bio !== undefined) therapist.bio = bio;
    if (languages !== undefined) therapist.languages = languages;
    if (specializations !== undefined) {
      therapist.specializations = specializations;
    }

    if (sessionDuration !== undefined) {
      therapist.sessionDuration = sessionDuration;
    }

    if (bufferTime !== undefined) {
      therapist.bufferTime = bufferTime;
    }

    if (sessionPrice !== undefined) {
      therapist.sessionPrice = sessionPrice;
    }

    if (timezone !== undefined) {
      therapist.timezone = timezone;
    }

    // Optional custom public slug
    if (slug !== undefined) {
      const normalizedSlug = String(slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!normalizedSlug) {
        return res.status(400).json({
          success: false,
          message: "A valid slug is required",
        });
      }

      const existingTherapist = await Therapist.findOne({
        slug: normalizedSlug,
        _id: { $ne: therapist._id },
      });

      if (existingTherapist) {
        return res.status(409).json({
          success: false,
          message: "This public profile link is already in use",
        });
      }

      therapist.slug = normalizedSlug;
    }

    await therapist.save();

    return res.status(200).json({
      success: true,
      message: "Therapist profile updated successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        phone: therapist.phone,
        avatar: therapist.avatar,
        bio: therapist.bio,
        languages: therapist.languages,
        specializations: therapist.specializations,
        sessionDuration: therapist.sessionDuration,
        bufferTime: therapist.bufferTime,
        sessionPrice: therapist.sessionPrice,
        timezone: therapist.timezone,
        slug: therapist.slug,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a public therapist profile by slug
export const getPublicProfile = async (req, res, next) => {
  try {
    const therapist = await Therapist.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    }).select(
      "name avatar bio languages specializations sessionDuration sessionPrice timezone slug"
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      therapist,
    });
  } catch (error) {
    next(error);
  }
};