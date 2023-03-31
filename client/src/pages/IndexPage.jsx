import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import Post from "../components/Post";

const IndexPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/post").then((response) => {
      response.json().then((posts) => {
        console.log(posts);
        setPosts(posts);
      });
    });
  }, []);

  return (
    <div>{posts.length > 0 && posts.map((post) => <Post {...post} />)}</div>
  );
};

export default IndexPage;
