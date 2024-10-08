import client from "../../client";
import bcrypt from "bcrypt";
import { uploadToS3 } from "../../shared/s3.utils";

export default {
  Mutation: {
    createAccount: async (
      _,
      {
        username,
        password,
        sex,
        interestingSex,
        birthDay,
        phoneNo,
        email,
        instaUsername,
        avatar,
      }
    ) => {
      try {

        const whereClause = {};

        if (username) {
          whereClause.username = username;
        }
        if (email) {
          whereClause.email = email;
        }
        if (instaUsername) {
          whereClause.instaUsername = instaUsername;
        }
        if (phoneNo) {
          whereClause.phoneNo = phoneNo;
        }


        const existingUser = await client.user.findFirst({
          where: {
            OR: [
              whereClause
            ],
          },
        });
        if (existingUser) {
          console.log("existingUser : " ,existingUser);
          throw new Error(
            "This usernam or instaUsername or email or phoneNo  is already taken."
          );
        }
        const bcyrptPassword = await bcrypt.hash(password, 10);
        console.log("avatar : ", avatar);
        let avatarUrl = null;
        if (avatar) {
          console.log("avatar exists : ", avatar);
          avatarUrl = await uploadToS3(avatar, username, "avatars");
          console.log("avatarUrl : ", avatarUrl);
        }

        await client.$transaction([
          client.user.create({
            data: {
              username,
              sex,
              interestingSex,
              birthDay,
              phoneNo,
              email,
              instaUsername,
              password: bcyrptPassword,
              userType: "P",
              userStatus: "M",
              ...(avatarUrl && { avatar: avatarUrl }),
            },
          }),
          client.location.create({
            data: {
              user: {
                connect: { username },
              },
            },
          }),
        ]);

        return {
          ok: true,
        };
      } catch (e) {
        console.log(e);
        return {
          ok: false,
          error: e,
        };
      }
    },
  },
  Query: {
    validCreateAccount: async (
      _,
      { username, instaUsername, phoneNo, email, nextPage }
    ) => {
      console.log("happening");
      const whereClause = [];
      if (username) {
        whereClause.push({ username });
      }
      if (email) {
        whereClause.push({ email });
      }
      if (instaUsername) {
        whereClause.push({ instaUsername });
      }
      if (phoneNo) {
        whereClause.push({ phoneNo });
      }

      if (whereClause.length == 0) {
        throw new Error("No parameter");
      }

      const existingUser = await client.user.findFirst({
        where: {
          OR: whereClause,
        },
      });
      console.log("existingUser : ", existingUser);
      if (existingUser) {
        return { ok: false, error: "existing user" };
      } else {
        return { ok: true, nextPage: nextPage };
      }
    },
  },
};
