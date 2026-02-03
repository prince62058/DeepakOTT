const TopSearch  = require("../models/topSearchModel");

// create top search
const createTopSearch = async(req,res)=>{
    const {movieWebSeriesId} = req.body;
    try{

        if(!movieWebSeriesId){
            return res.status(400).json({
                success:false,
                message:"movieWebSeriesId is required !"
            })
        }

        let data = await TopSearch.findOne({movieWebSeriesId});
        if(data){
            const mainCount = Number(data.count) ;
            data.count = Number(mainCount+1);
            await data.save();
        }else{
           data =  await TopSearch.create({
                movieWebSeriesId
            })
        }

        return res.status(201).json({
            success:true,
            message:"Top Search Created Successfully.",
            data: data
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

// get all top search
const pastTopSearchedData = async(req,res)=>{
    const {page=1, limit=20, sort=-1} = req.query;
    const skip = (Number(page)-1)*limit;
    try{
        const data = await TopSearch.find().sort({count:parseInt(sort)}).skip(skip).limit(limit).populate("movieWebSeriesId");
        const total = await TopSearch.countDocuments();

        return res.status(200).json({
            success:true,
            message:"All Top Searched Data Fetched Successfully.",
            data:data,
            currentPage:Number(page),
            page:Math.ceil(total/limit)
        })

    }catch(error){
        return res.status(500).json({
            success:fal
        })
    }
}

module.exports ={
    createTopSearch,
    pastTopSearchedData
}