import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import { Stream } from "stream";

// Upload course
export const uploadCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const thumbnail = req.file; // Access the uploaded file from multer

    if (thumbnail) {
      // If a thumbnail is uploaded, upload it to Cloudinary
      const myCloud = await cloudinary.v2.uploader.upload_stream(
        { folder: "courses" },
        (error, result) => {
          if (error) {
            return next(new ErrorHandler("Cloudinary upload failed", 500));
          }

          // Save Cloudinary response data to the course data
          data.thumbnail = {
            public_id: result?.public_id,
            url: result?.secure_url,
          };

          // Create the course after the upload is complete
          createCourse(data, res);
        }
      );

      // Create a stream to upload the thumbnail buffer
      const stream = require("stream");
      const bufferStream = new stream.PassThrough();
      bufferStream.end(thumbnail.buffer); // Use the buffer from multer
      bufferStream.pipe(myCloud); // Pipe the buffer to Cloudinary upload stream
    } else {
      // If no thumbnail is uploaded, proceed to create the course without it
      data.thumbnail = null; // Set thumbnail to null or remove this line if you want to omit it

      // Create the course without a thumbnail
      await createCourse(data, res);
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};


// Edit course
export const editCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id; // Get the course ID from params
    const existingCourse = await CourseModel.findById(courseId); // Fetch the existing course

    if (!existingCourse) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const data = req.body;
    const thumbnail = req.file; // Access the uploaded file from multer

    if (thumbnail) {
      // Remove the old thumbnail from Cloudinary
      await cloudinary.v2.uploader.destroy(thumbnail.public_id);

      // Upload the new thumbnail using the buffer
      const myCloud = await cloudinary.v2.uploader.upload_stream(
        { folder: "courses" },
        (error, result) => {
          if (error) {
            return next(new ErrorHandler("Cloudinary upload failed", 500));
          }

          // Update thumbnail data
          data.thumbnail = {
            public_id: result?.public_id,
            url: result?.secure_url,
          };
        }
      );

      // Create a stream to upload the thumbnail buffer
      const bufferStream = new Stream.PassThrough();
      bufferStream.end(thumbnail.buffer); // Use the buffer from multer
      bufferStream.pipe(myCloud); // Pipe the buffer to Cloudinary upload stream
    }

    const course = await CourseModel.findByIdAndUpdate(courseId, {
      $set: data,
    }, { new: true });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};