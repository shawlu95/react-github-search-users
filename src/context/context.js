import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

// provider, consumer - GithubContext.Provider
// wrap whole application (children) with globally accessible value
const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: '' });
  const searchGithubUser = async (user) => {
    if (!user) {
      toggleError(true, 'Please enter user ID');
    }

    // turn off error
    toggleError();

    setLoading(true);

    // weird way to call axios GET
    const res = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );

    if (res) {
      setGithubUser(res.data);
      const { login, followers_url } = res.data;

      // refresh results at the same time
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((res) => {
          const [repos, followers] = res;

          if (repos.status !== 'fulfilled') {
            toggleError(true, `Failed to read repos: ${repos.status}`);
          }

          if (followers.status !== 'fulfilled') {
            toggleError(true, `Failed to read followers: ${followers.status}`);
          }

          if (repos.status === 'fulfilled') {
            setRepos(repos.value.data);
          }

          if (followers.status === 'fulfilled') {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, 'User not found');
    }

    setLoading(false);
  };

  useEffect(() => {
    const checkRequests = async () => {
      const {
        data: {
          rate: { remaining },
        },
      } = await axios.get(`${rootUrl}/rate_limit`);
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, 'Exceeded hourly rate!');
      }
    };
    checkRequests();
  }, [followers, repos]);

  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        loading,
        error,
        searchGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
