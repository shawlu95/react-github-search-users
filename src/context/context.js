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
  const [repos, setRepose] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({ show: false, msg: '' });
  const searchGithubUser = async (user) => {
    if (!user) {
      toggleError(true, 'Please enter user ID');
    }

    // turn off error
    toggleError();

    // weird way to call axios GET
    const res = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );

    if (res) {
      setGithubUser(res.data);
    } else {
      toggleError(true, 'User not found');
    }
    console.log('searching', user);
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
  }, []);

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
        error,
        searchGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
