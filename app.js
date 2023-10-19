//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//to connect with database which is mongodb
mongoose.connect("mongodb+srv://bird431456:431456@cluster0.fj0jsvi.mongodb.net/todolistDB", {useNewUrlParser:true});

//create a new schema
const itemsSchema = new mongoose.Schema({name:String});

//create a model
const Item = mongoose.model("Item", itemsSchema);

//creating items
const item1 = new Item({
    name:"Love Trisha Mae"
});

const item2 = new Item({
    name:"Love baby Ashxer"
});

const item3 = new Item({
    name: "Love both of them"
});

//storing items in array
const defaultItems = [item1, item2, item3];

//create new schema for customlist
const listSchema = new mongoose.Schema ({
    name: String,
    item: [itemsSchema]
});

//create new model for customlist
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    //flash the item in the web
    Item.find({})
    .then (function(foundItems){
        if (foundItems.length === 0) {
            //save may items
            Item.insertMany(defaultItems)
            .then(function(){
                console.log("Successfull saved in our DB");
            })
            .catch(function(){
                console.log(err);
            });
        res.redirect("/")
        } else {
            res.render("list", {listTitle:"Today", newListItems: foundItems});
        }
    })
    .catch (function(err){
        console.log(err);
    });
});

//to create express route parameters
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then (function(foundList){
        if (!foundList) {
            //if foundlist is not exist then create new list
            const list = new List({
                name: customListName,
                item: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            // if existed then show only
            res.render("list", {
                listTitle:foundList.name,
                newListItems: foundList.item  
            });
        }
    })
    .catch(function(err){});
});

//add new item using web button
app.post("/", function(req, res){
    const itemName = req.body.NewItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });
    
    // to save the new items in the new route
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}).exec()
        .then ((foundList) => {
            foundList.item.push(item);
            foundList.save();
            res.redirect ("/" + listName);
        })
        .catch((err) => {
            console.log (err);
        });
    }
});

//to delete item from the list
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    //to delete documents in custom route
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
        .then (() => {
            console.log("Successfully deleted the Item id");
        res.redirect("/");
        });
    } else {
        // to pull item in an array
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {item: {_id: checkedItemId}}}
        )
        .then (function(foundList){
            res.redirect("/" + listName);
        });
    }
});

app.listen(3000,function(){
    console.log("Server started at port 3000");
});
