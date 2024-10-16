import { NextFunction, Response } from "express";
import OrderModel from "../models/order.Model";

// Create a new order
export const newOrder = async (data: any, res: Response, next: NextFunction) => {
  try {
    // Create the order using the OrderModel
    const order = await OrderModel.create(data);
    
    // Send the response with order details
    res.status(201).json({
      success: true,    // Fixed typo from "succcess" to "success"
      order,
    });
  } catch (error: any) {
    next(error);  // Pass the error to the error handler middleware
  }
};
