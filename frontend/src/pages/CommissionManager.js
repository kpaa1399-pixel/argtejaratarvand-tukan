import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CommissionManager() {
  const [Commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const BASE_URL = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    fetchCommissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCommissions = () => {
    axios.get(`${BASE_URL}/Commissions`)
      .then((res) => {
        setCommissions(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching Commissions:', error);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCommission = { title, amount: parseInt(amount, 10) };

    axios.post(`${BASE_URL}/Commissions`, newCommission)
      .then(() => {
        setTitle('');
        setAmount('');
        fetchCommissions();
      })
      .catch((error) => {
        console.error('Error adding Commission:', error);
      });
  };

  if (loading) return <p>در حال بارگذاری...</p>;

  return (
    <div>
      <h2>مدیریت کمیسیون‌ها</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="عنوان کمیسیون"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="مبلغ (تومان)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">افزودن</button>
      </form>

      <ul>
        {Commissions.map((item, index) => (
          <li key={index}>
            <strong>{item.title}</strong> - مبلغ: {item.amount} تومان
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CommissionManager;