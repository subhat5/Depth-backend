import multer from "multer"; //This imports the Multer middleware in an ES6 module system. Multer is used to handle file uploads in Express.js applications.
const storage = multer.diskStorage({
  /*
  multer.diskStorage({...})
Defines the storage settings for uploaded files.
Here, we configure where and how the files should be stored on disk.
The diskStorage method returns an object that we pass to Multer.
  */
  destination: function (req, file, cb) {
    cb(null, "public/temp");
    /*destination: function (req, file, cb) {...}
    This function determines where the uploaded files should be saved.
    It receives:
    req: The HTTP request object.
    file: Information about the uploaded file.
    cb: A callback function used to specify the destination.
    cb(null, '/public/temp')
    The first parameter (null) is for errors (if any). Since there's no error, we pass null.
    The second parameter ('/public/temp') is the directory where the uploaded files will be stored.
    Control Flow:
    When a file is uploaded, this function runs and assigns the correct directory before saving the file.*/
  },

  filename: function (req, file, cb) {
    /*filename: function (req, file, cb) {...}

This function sets a unique name for each uploaded file.
It receives:
req: The HTTP request object.
file: Information about the uploaded file (name, type, etc.).
cb: A callback function to specify the file name.*/
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    /* Date.now() → Returns the current timestamp (milliseconds since 1970).
Math.random() * 1E9 → Generates a random number up to 1 billion.
Math.round(...) → Rounds it to the nearest whole number.
Example output: 1707765432153-845678910*/
    cb(null, file.originalname);
    // file.fieldname → Gets the input field name from the form (e.g., "profilePic").
    // file.fieldname + '-' + uniqueSuffix → Creates a unique file name.
    // Example: If the field name is "avatar", the file might be saved as:
    // Copy
    // Edit
    // avatar-1707765432153-845678910.jpg
  },
});

export const upload = multer({ storage: storage });
