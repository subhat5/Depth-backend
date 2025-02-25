import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("clodnary file path" + localFilePath);
    if (!localFilePath) {
      return null;
    }
    //upload the file on cloudnary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    console.log("file is uploaded on cloudnary", response.url);
    console.log(response)
    return response;
  } catch (error) {
    // fs.unlinkSync(localFilePath); //remove the localy saved temporary file as the upload operation got failed
    console.log("catching error");
    return null;
  }
};

export default uploadOnCloudinary;
