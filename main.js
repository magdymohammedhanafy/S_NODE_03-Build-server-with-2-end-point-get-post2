
import axios from "axios";
import http from "http";
import { string, number } from 'yup';


const Scheme=
{
  title: string().required(),
  price: number().required().positive(),
  description: string(),
  categoryId: number().required().positive().integer(),
  
}

const getEgpCurrency = async (curr) => {
   let currencies = await fetch("https://openexchangerates.org/api/latest.json?app_id=4fb54a06490f4d09a8bf0049e7b9d7eb");
   currencies=await currencies.json();
   console.log(currencies.rates.curr);
   return currencies.rates[`${curr}`];
}
const getProducts=async function(curr){
   //get egyptian convertion
   let transCurrency=await getEgpCurrency(curr);   
    try 
    {
      //fetch data from api
       let data = await fetch('https://api.escuelajs.co/api/v1/products') ;
       data=await data.json();
       //extract categories id 
       let categoryId =[];
       data.forEach(e => {
       categoryId.push(e.category.id); 
       });
       //sorting categories id
       categoryId.sort(function(a,b){
         return a - b;
       }) 
       //extract unique id 
       let categoryUniqueId=new Set(categoryId);
       categoryUniqueId=[...categoryUniqueId];
      
       // Categorize the list products into a different buckets according to the product category
       let finallArray=[];
       categoryUniqueId.forEach(function(a,i)  {
       let obj=
       {
         "category":
         {
            "id": a  
         },
         "products":[]
       };
       data 
       data.forEach(b=> {
         if(a===b.category.id)
         {
           obj.category.name=b.category.name;
           let obj2=
           {
            "id": b.id,
            "title": b.title,
            "price": b.price*(transCurrency || 1),
            "description": b.description,
            "category": 
            {
               "id": b.category.id,
               "name": b.category.name,
               "image": b.category.image
            }
         }
           obj.products.push(obj2);
         } 
       })
       finallArray.push(obj);   
      });
      //console.log(finallArray); 
      return finallArray;
    } 
    catch (error) 
    {
    console.log(error);
    }
  }





  let server=http.createServer(async(req,res)=>{
    let method=req.method;
    let url=req.url;
    let curr=req.url.split('=').at(-1).toUpperCase();
    let url2=req.url.split('=').at(-2);
    console.log(url2);
    console.log(url);
    
    if(method==='GET')
    {
      if(url==='/')
      {
      let finalProducts=await getProducts()
      res.setHeader("content-type", "application/json");
      res.writeHead(200,'Status Ok');
      res.write(JSON.stringify(finalProducts));
      res.end();
      }
       else if(url2==="/?curr")
      {
      let finalProducts=await getProducts(curr)
      res.setHeader("content-type", "application/json");
      res.writeHead(200,'Status Ok');
      res.write(JSON.stringify(finalProducts));
      res.end();
      }
    }
    
    else if(method==='POST')
    {
      console.log(",,,,,")
      let chuncks = [];
      req.on('data',(chunk)=>{
        chuncks.push(chunk);
      });
      req.on('end',async ()=>{
        try
        {
          let Product = Scheme.validateSync(JSON.parse(chuncks.toString()),
           {
            strict: true,
           });
          let response =await axios.post("https://api.escuelajs.co/api/v1/products/", Product, {
          headers: { 'Content-Type': 'application/json' }
          });
          res.setHeader("content-type", "application/json");
          res.writeHead(200);
          res.write(JSON.stringify(response.data));
          res.end();

        }
        catch(error)
        {
          res.writeHead(400);
          res.end();
        }
      });

      req.on("error", (error) => {
        res.setHeader("content-type", "text");
        res.writeHead(500);
        res.write(error.message);
        res.end();
    });

    }
  })
  server.listen(5000,()=>{
    console.log('server is listening to 5000');
  })

  


   


 
  
 



