import { PrismaClient } from "@prisma/client";
import axios from "axios";
import cheerio from "cheerio";
import cookieParser from "cookie-parser";
import "dotenv/config";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}

export default function setupRoutes(app) {
  app.use(cookieParser());

  app.post("/api/login", async (req, res) => {
    const { login, password } = req.body;

    try {
      const user = await prisma.users.findFirst({
        where: { login },
      });

      if (!user) {
        return res.status(401).json({ error: "Неверный логин или пароль" });
      }


      if (user.password === password) {
        const token = generateToken(user.id);
        const cookieName = user.role === "admin" ? "isAuthAdmin" : "isUser";


        res.cookie(cookieName, "true", {
          httpOnly: false,
          maxAge: 86400 * 1000,
        });
        res.cookie("username", user.login, {
          httpOnly: false,
          maxAge: 86400 * 1000,
        });

        res.status(200).json({ success: true, token, cookieName });
      } else {
        res.status(401).json({ success: false, error: "Неверный логин или пароль" });
      }
    } catch (error) {
      console.error("Error authenticating user:", error);
      res.status(500).json({ error: "Произошла ошибка при аутентификации" });
    }
  });

  app.post('/api/settingsUpdate', async (req, res) => {
    const { username, salary, hourlyRate } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {
      const user = await prisma.users.findFirst({
        where: { login: username },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: {
          Salary: parseInt(salary, 10),
          HourlyRate: parseInt(hourlyRate, 10),
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.get('/api/settingsGet', async (req, res) => {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {
      const user = await prisma.users.findFirst({
        where: { login: username },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
        salary: user.Salary,
        hourlyRate: user.HourlyRate,
      });
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  app.get('/api/getUserNames', async (req, res) => {
    const url = 'https://crm.profi-soft.kz/profisoft_apps/project_hours.php?apiKey=H2894SqJir*G%21f&month=2024-07&user_id=15771&ext=Y';

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const userNames = [];
      $('select[name="user_id"] option').each((i, elem) => {
        const userId = $(elem).val();
        const userName = $(elem).text().trim();
        if (userId && userName) {
          userNames.push({ userId, userName });
        }
      });

      res.status(200).json({ userNames });
    } catch (error) {
      console.error("Error fetching user names:", error);
      res.status(500).json({ error: "Произошла ошибка при получении данных" });
    }
  });

  app.get('/api/getTableUsers', async (req, res) => {
    const { month, user_id } = req.query;
    const apiKey = "H2894SqJir*G%21f";
    if (!month || !user_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const url = `https://crm.profi-soft.kz/profisoft_apps/project_hours.php?apiKey=${apiKey}&month=${month}&user_id=${user_id}&ext=Y`;
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      let result = [];
      let stopProcessing = false;

      $('.user-time tbody tr').each((index, element) => {
        if (index === 0 || index === 1) return;
        if (stopProcessing) return;

        const id = $(element).find('th').eq(0).text().trim();
        const taskName = $(element).find('th').eq(1).text().trim();
        const time = $(element).find('th').eq(2).text().trim();
        const plannedTime = $(element).find('th').eq(3).text().trim();

        if (id === "Проектные часы" && !taskName && !time && !plannedTime) {
          stopProcessing = true;
          return;
        }

        result.push({ id, taskName, time, plannedTime });
      });

      
      result = result.filter(task => task.id !== "Всего");

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  app.get('/api/getProjectHours', async (req, res) => {
    const { month, user_id } = req.query;
    const apiKey = "H2894SqJir*G%21f";
    if (!month || !user_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const url = `https://crm.profi-soft.kz/profisoft_apps/project_hours.php?apiKey=${apiKey}&month=${month}&user_id=${user_id}&ext=Y`;
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const result = [];
      let isProjectHoursSection = false;

      $('.user-time tbody tr').each((index, element) => {
        const id = $(element).find('th').eq(0).text().trim();
        const taskName = $(element).find('th').eq(1).text().trim();
        const time = $(element).find('th').eq(2).text().trim();
        const plannedTime = $(element).find('th').eq(3).text().trim();

        if (id === "Проектные часы" && !taskName && !time && !plannedTime) {
          isProjectHoursSection = true;
          return;
        }

        if (id === "ID" && taskName === "Название задачи" && time === "Время" && plannedTime === "Плановое время") {
          return;
        }

        if (id === "Всего" && !taskName && time === "120 (2)" && !plannedTime) {
          return;
        }

        if (isProjectHoursSection) {
          if (id && !taskName && !time && !plannedTime) {
            result.push({ id: 'ProjectName', taskName: id, time, plannedTime });
          } else {
            result.push({ id, taskName, time, plannedTime });
          }
        }
      });

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

}
