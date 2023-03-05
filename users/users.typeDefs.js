import { gql } from "graphql-tag";

export default gql`
  type User {
    id: Int!
    username: String!
    sex: String!
    interestingSex: String!
    password: String!
    instaUsername: String
    email: String
    following: [User]
    followers: [User]
    avatar: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    Users: [User]
  }
`;