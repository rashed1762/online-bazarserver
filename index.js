const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT ||4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v9dzlco.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const productCollection = client.db('online_bazar').collection('products');
        const userCollection = client.db('online_bazar').collection('users');
        const cartCollection = client.db('online_bazar').collection('cart');
       
        app.get('/products', async(req,res)=>{
          const query={};
          const cursor=productCollection.find(query);
          const products=await cursor.toArray();
          res.send(products);

        });

        app.post('/products',async(req,res)=>{
          const newProduct=req.body;
          const result=await productCollection.insertOne(newProduct);
          res.send(result);
        })

        app.put('/user/admin/:email',async(req,res)=>{
          const email=req.params.email;
          const requester=req.decoded.email;
          const requesterAccount=await userCollection.findOne({email:requester});
          if(requesterAccount.role=== 'admin'){
            const filter={email:email};
            const updateDoc={
              $set:{role:'admin'},
            };
            const result=await userCollection.updateOne(filter,updateDoc);
            res.send(result);
          }
          else {
            res.status(403).send({message:'forbidden'});
          }
       
        })
         

        app.put('/user/:email',async(req,res)=>{
          const email=req.params.email;
          const user=req.body;
          const filter={email:email};
          const options={upsert:true};
            const updateDoc={
              $set:user,
            };
            const result=await userCollection.updateOne(filter,updateDoc,options);
            const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'2h'})
            res.send({result,token});
          })
          app.post('/cart',async(req,res)=>{
            const booking=req.body;
            console.log(booking)
            const query = {value:booking.value,date:booking.date,patient:booking.patient};
            const result=await cartCollection.insertOne(booking);
            res.send(result);
          })
          app.get('/cart', async(req,res)=>{
            const query={};
            const cursor=cartCollection.find(query);
            const products=await cursor.toArray();
            res.send(products);
  
          });
          app.get('/cart/:id', async(req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const result=await cartCollection.deleteOne(query);
            res.send(result);
  
          });
          
          

        app.get('/user',async(req,res)=>{
          const users=await userCollection.find().toArray();
          res.send(users);
        }) 
  

    

    }
    finally{

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })