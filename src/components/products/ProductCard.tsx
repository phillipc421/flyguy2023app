"use client";
import React, { useState } from "react";

import { Product } from "@/types/Product";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";

export interface ProductCardProps {
  product: Product;
}

export enum TabIndex {
  LongDescription = 0,
  Ingredients = 1,
}

export default function ProductCard({ product }: ProductCardProps) {
  const [tabIndex, setTabIndex] = useState(0);

  const tabChangeHanlder = (e: React.SyntheticEvent, i: number) => {
    setTabIndex(i);
  };

  const tabContent = [product.long_description, product.ingredients];

  return (
    <Card sx={{ maxWidth: "22rem" }} raised={false}>
      <CardContent>
        <Typography variant="h2">{product.name}</Typography>
        <Typography>
          <s>${product.price}</s> ${product.current_price}
        </Typography>
        <CardMedia
          component="img"
          src={product.photo_url}
          alt={product.name}
        ></CardMedia>
        <Typography>{product.description}</Typography>
        <Tabs value={tabIndex} onChange={tabChangeHanlder} variant="fullWidth">
          <Tab
            icon={<InfoOutlinedIcon></InfoOutlinedIcon>}
            aria-label="product-info"
          ></Tab>
          <Tab
            icon={<SpaOutlinedIcon></SpaOutlinedIcon>}
            aria-label="product-ingredients"
          ></Tab>
        </Tabs>
        <Box sx={{ paddingBlock: "0.5rem" }}>
          <Typography>{tabContent[tabIndex]}</Typography>
          {tabIndex === TabIndex.Ingredients && (
            <Typography sx={{ marginTop: "0.5rem" }}>
              *Organic Ingredient
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Button variant="contained">Add To Cart</Button>
      </CardActions>
    </Card>
  );
}
