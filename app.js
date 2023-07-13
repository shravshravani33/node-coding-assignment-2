const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const path = require("path");
const databasePath = path.join(__dirname, "twitterClone.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);

    process.exit(1);
  }
};

initializeDbAndServer();

////API 1
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const checkUser = `SELECT username FROM WHERE username = '${username}';`;
  const dbUser = await db.get(checkUser);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    let pwLen = password.length;
    if (pwLen < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const requestQuery = `INSERT INTO user(name,username,password,gender)
        VALUES('${name}','${username}','${hashedPassword}','${gender}');`;
      await db.run(requestQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

////API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUserExist = await db.get(checkUser);
  if (dbUserExist !== undefined) {
    if (checkPassword === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MySecret");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

const authenticationToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.header["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }

  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "MySecret", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

////API 3
app.get(
  "/user/tweets/feed/",
  authenticationToken,
  async (request, response) => {
    let { username } = request;
    const getUSerIdQuery = `
      SELECT user_id from user WHERE username = '${username}';`;
    const getUserId = await db.get(getUSerIdQuery);

    const getFollowerIdsQuery = `
      SELECT following_user_id FROM follower 
     WHERE follower_user_id = '${getUserId.user_id}';`;
    const getFollowerIds = await db.all(getFollowerIdsQuery);
    const getFollowerIdsSimple = getFollowerIds.map((each) => {
      return each.following_user_id;
    });

    const getTweetQuery = `SELECT user.username,tweet.tweet,tweet.date_time AS dateTime 
      FROM user INNER JOIN tweet ON user.user_id = tweet.user_id WHERE 
      user.user_id IN('${getFollowerIdsSimple}') ORDER BY tweet.date_time DESC LIMIT 4;`;
    const responseResult = await db.all(getTweetQuery);
    response.send(responseResult);
  }
);

////API 4
app.get("/user/following/", authenticationToken, async (request, response) => {
  let { username } = request;
  const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`;
  const getUserId = await db.get(getUserIdQuery);

  const getFollowerIdsQuery = `SELECT following_user_id FROM follower
      WHERE follower_user_id = '${getUserId.user_id}';`;

  const getFollowerIdsArray = await db.all(getFollowerIdsQuery);
  const getFollowerIds = getFollowerIdsArray.map((each) => {
    return each.following_user_id;
  });
  const getFollowersResultQuery = `SELECT name FROM user WHERE user_id IN('${getFollowerIds}');`;
  const responseResult = await db.all(getFollowersResultQuery);
  response.send(responseResult);
});

////API 5
app.get("/user/followers/", authenticationToken, async (request, response) => {
  let { username } = username;
  const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`;
  const getUserId = await db.get(getUserIdQuery);
  console.log(getFollowerIdsArray);
  const getFollowerIds = getFollowerIdsArray.map((each) => {
    return each.following_user_id;
  });
  console.log(`${getFollowerIds}`);

  const getFollowersNameQuery = `SELECT name FROM user WHERE user_id IN ('${getFollowerIds}');`;
  const getFollowerName = await db.all(getFollowersNameQuery);
  response.send(getFollowerName);
});

////API 6
const api6OP = (tweetData, LikesCount, replyCount) => {
  return {
    tweet: tweetData.tweet,
    likes: LikesCount.likes,
    replies: replyCount.replies,
    dateTime: tweetData.date_time,
  };
};

app.get("/tweets/:tweetId/", authenticationToken, async (request, response) => {
  const { tweetId } = request.params;
  let { username } = request;
  const getUSerIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`;
  const getUserId = await db.get(getUSerIdQuery);
  const getFollowingIdsQuery = `SELECT following_user_id FROM follower 
      WHERE follower_user_id = '${getUserId.user_id}';`;
  const getFollowingIdsArray = await db.all(getFollowingIdsQuery);
  const getFollowingIds = getFollowingIdsArray.map((each) => {
    return eachFollower.following_user_id;
  });

  const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id IN(${getFollowingIds});`;
  const getTweetIdsArray = await db.all(getTweetIdsQuery);
  const followingTweetIds = getTweetIdsArray.map((each) => {
    return eachId.tweet_id;
  });

  if (followingTweetIds.includes(parseInt(tweetId))) {
    const likes_count_query = `SELECT COUNT(user_id) AS likes FROM like 
        WHERE tweet_id = '${tweetId}';`;
    const likes_count = await db.get(likes_count_query);

    const reply_count_query = `SELECT COUNT(user_id) AS replies FROM reply
        WHERE tweet_id = '${tweetId}';`;
    const reply_count = await db.get(reply_count_query);

    const tweet_tweetDateQuery = `SELECT tweet,date_time FROM tweet WHERE
          tweet_id = '${tweetId}';`;
    const tweet_tweetDate = await db.get(tweet_tweetDateQuery);
    response.send(api6OP(tweet_tweetDate, likes_count, reply_count));
  } else {
    response.status(401);
    response.send("Invalid Request");
    console.log("Invalid Request");
  }
});

////API 7
const convertLikedUserNameDBObjectToResponseObject = (dbObject) => {
  return {
    likes: dbObject,
  };
};
app.get(
  "/tweets/:tweetId/likes/",
  authenticationToken,
  async (request, response) => {
    const { tweetId } = request.params;
    let { username } = request;
    const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`;
    const getUserId = await db.get(getUserIdQuery);

    const getFollowingIdsQuery = `SELECT following_user_id FROM follower WHERE
      follower_user_id = '${getUserId.user_id}';`;
    const getFollowingIdsArray = await db.all(getFollowingIdsQuery);
    const getTweetIds = getFollowingIdsArray.map((each) => {
      return each.tweet_id;
    });

    if (getTweetIds.includes(parseInt(tweetId))) {
      const getLikedUsersNAmeQuery = `SELECT user.username AS likes FROM
          user INNER JOIN like ON user.user_id = like.user_id WHERE like.tweet_id='${tweetId}';`;
      const getLikedUSerNamesArray = await db.all(getLikedUsersNAmeQuery);
      const getLikedUserNAmes = getLikedUSerNamesArray.map((each) => {
        return each.likes;
      });
      response.send(
        convertLikedUserNameDBObjectToResponseObject(getLikedUserNAmes)
      );
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

////API 8
const convertUserNameReplyedDBObjectToResponseObject = (dbObject) => {
  return {
    replies: dbObject,
  };
};
app.get(
  "/tweets/:tweetId/replies/",
  authenticationToken,
  async (request, response) => {
    const { tweetId } = request.params;
    console.log(tweetId);
    let { username } = request;
    const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const getUserId = await db.get(getUserIdQuery);
    const getFollowingIdsQuery = `SELECT following_user_id FROM follower WHERE
      follower_user_is = '${getUserId.user_id}';`;
    const getFollowingIdsArray = await db.all(getFollowingIdsQuery);
    const FollowingIds = getFollowerIdsArray.map((each) => {
      return each.following_user_id;
    });
    console.log(getFollowerIds);

    const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id IN('${getFollowingIds}');`;
    const getTweetIdsArray = await db.all(getTweetIdsQuery);
    const getTweetIds = getFollowingIdsArray.map((each) => {
      return each.tweet_id;
    });
    console.log(getTweetIds);

    if (getTweetIds.includes(parseInt(tweetId))) {
      const getUsernameReplyTweetsQuery = `SELECT user.name,reply.reply
        FROM user INNER JOIN reply ON user.user_id = reply.user_id
        WHERE reply.tweet_id = '${tweetId}';`;
      const getUsernameReplyTweets = await db.all(getUsernameReplyTweetsQuery);
      response.send(
        convertUserNameReplyedDBObjectToResponseObject(getUsernameReplyTweets)
      );
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

////API 9
app.get("/user/tweets/", authenticationToken, async (request, response) => {
  let { username } = username;
  const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`;
  const getUserId = await db.get(getUserIdQuery);
  console.log(getUserId);
  const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id = '${getUserId.user_id}';`;
  const getTweetIdsArray = await db.get(getTweetIdQuery);
  const getTweetIds = getTweetIdsArray.map((each) => {
    return parseInt(each.tweet_id);
  });
  console.log(getTweetIds);
});

////API 10
app.post("/user/tweets/", authenticationToken, async (request, response) => {
  let { username } = request;
  const getUserIdQuery = `select user_id from user where username = '${username}';`;
  const getUSerId = await db.get(getUSerIdQuery);
  const { tweet } = request.body;
  const currentDate = new Date();
  console.log(currentDate.toISOString().replace("T", " "));
  const postRequestQuery = `insert into tweet(tweet,user_id,date_time
        values('${tweet}','${getUserId.user_id}','${currentDate}',);`;
  const responseResult = await db.run(postRequestQuery);
  const tweet_id = responseResult.lastID;
  response.send("Created a Tweet");
});

////API 11
app.delete(
  "/tweets/:tweetId/",
  authenticationToken,
  async (request, response) => {
    let { username } = request;
    const getUserIdQuery = `select user_id from user where username = '${username}';`;
    const getUserId = await db.get(getUserIdQuery);
    const getUSerTweetsListQuery = `select tweet_id from tweet where user_id ='${getUserId.user_id}';`;
    const getUSerTweetsListArray = await db.all(getUSerTweetsListQuery);
    const getUSerTweetsList = getUSerTweetsListArray.map((each) => {
      return each.tweet_id;
    });
    console.log(getUSerTweetsList);
    if (getUSerTweetsList.includes(parseInt(tweetId))) {
      const deleteTweetQuery = `delete from tweet where tweet_id = '${tweetId}';`;
      await db.run(deleteTweetQuery);
      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);
module.exports = app;
