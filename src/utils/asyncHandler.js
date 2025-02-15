const asyncHandler = (requestHandler) => {
  
  return (req, res, next) => {
    console.log(req)
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };



// const asyncHandler = (func)=>{
//  return async (req, res, next)=>
//   {
//     try{
//       await func(req, res ,next)

//     }
//     catch(error)
//     {
//       res.status(error.code || 500).json({
//         succes: false,
//         messege: error.messege
//       })

//     }

//   }

// }
