import SessionNote from "../models/SessionNote.js";
import Session from "../models/Session.js";

export const createSessionNote = async (req, res, next) => {
  try {
    const {
      sessionId,
      content,
      type,
      isClientVisible,
      attachments,
    } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({
        success: false,
        message: "Session ID and content are required",
      });
    }

    const session = await Session.findOne({
      _id: sessionId,
      therapist: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Support the new PDF-compliant `type` field.
    // Keep temporary compatibility with the existing frontend
    // that still sends `isClientVisible`.
    const noteType =
      type ??
      (isClientVisible === true ? "shared" : "private");

    if (!["private", "shared"].includes(noteType)) {
      return res.status(400).json({
        success: false,
        message: "Note type must be either private or shared",
      });
    }

    const note = await SessionNote.create({
      session: session._id,
      therapist: session.therapist,
      client: session.client,
      content,
      type: noteType,
      attachments: attachments ?? [],
    });

    const populatedNote = await SessionNote.findById(note._id)
      .populate("session", "startTime endTime status")
      .populate("client", "name email");

    res.status(201).json({
      success: true,
      message: "Session note created successfully",
      note: populatedNote,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionNotes = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      therapist: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const notes = await SessionNote.find({
      session: session._id,
      therapist: req.user.id,
    })
      .populate("client", "name email")
      .populate("session", "startTime endTime status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};


export const updateSessionNote = async (req, res, next) => {
  try {
    const {
      content,
      type,
      isClientVisible,
      attachments,
    } = req.body;

    if (
      content === undefined &&
      type === undefined &&
      isClientVisible === undefined &&
      attachments === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update the note",
      });
    }

    const note = await SessionNote.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Session note not found",
      });
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Content cannot be empty",
        });
      }

      note.content = content;
    }

    // Prefer the new PDF-compliant `type` field.
    // Keep temporary compatibility with the existing frontend.
    if (type !== undefined) {
      if (!["private", "shared"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Note type must be either private or shared",
        });
      }

      note.type = type;
    } else if (isClientVisible !== undefined) {
      note.type = isClientVisible === true ? "shared" : "private";
    }

    if (attachments !== undefined) {
      note.attachments = attachments;
    }

    await note.save();

    const updatedNote = await SessionNote.findById(note._id)
      .populate("session", "startTime endTime status")
      .populate("client", "name email");

    res.status(200).json({
      success: true,
      message: "Session note updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSessionNote = async (req, res, next) => {
  try {
    const note = await SessionNote.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Session note not found",
      });
    }

    await SessionNote.deleteOne({ _id: note._id });

    res.status(200).json({
      success: true,
      message: "Session note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

