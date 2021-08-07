import React from "react";
import { gql, useMutation, useSubscription } from "@apollo/client";
import { isLoggedInVar } from "../cache";
import { LoginForm, Loading } from "../components";
import * as LoginTypes from "./__generated__/login";

export const LOGIN_USER = gql`
  mutation Login($email: String!) {
    login(email: $email) {
      id
      token
    }
  }
`;

export const USER_LOGINED = gql`
  subscription {
    logined {
      id
      token
    }
  }
`;
export default function Login() {
  const [login, { loading, error }] = useMutation<
    LoginTypes.Login,
    LoginTypes.LoginVariables
  >(LOGIN_USER, {
    onCompleted({ login }) {
      if (login) {
        localStorage.setItem("token", login.token as string);
        localStorage.setItem("userId", login.id as string);
        isLoggedInVar(true);
      }
    },
  });

  const data = useSubscription<LoginTypes.Logined, LoginTypes.LoginVariables>(
    USER_LOGINED,
    {
      onSubscriptionData(data) {
        console.log(data);
      },
    }
  );

  console.log(data);

  if (loading) return <Loading />;
  if (error) return <p>An error occurred</p>;

  return <LoginForm login={login} />;
}
