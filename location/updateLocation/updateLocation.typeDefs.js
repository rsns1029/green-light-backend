import { gql } from "graphql-tag";

export default gql`
  type Mutation {
    updateLocation(lat: Float!, lon: Float!, maxD: Float): MutationResponse
  }
`;
