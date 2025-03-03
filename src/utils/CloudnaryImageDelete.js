import { v2 as cloudinary } from "cloudinary";

const CloudnaryImgDlt = async (url) => {
  const publicId = cloudinary.utils.public_id(url);
  await cloudinary.uploader.destroy(publicId);
};

export { CloudnaryImgDlt };
