import { sign, verify } from "jsonwebtoken"
import { kv } from "@vercel/kv"

// Check if the username and password is correct and set a session cookie
export async function POST(req: Request) {
  const { username, password } = await req.json()

  const storedPassword = String(await kv.get(username))

  if (storedPassword !== null && storedPassword === password) {
    const user = {
      username,
      password,
    }

    // Secret key to sign the token
    const secretKey = process.env.JWT_SECRET as string

    // Create a JWT token
    const token = sign(user, secretKey, { expiresIn: "24h" }) // Expires in 24 hours

    const res = new Response(
      JSON.stringify({ message: "Authentication successful" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie":
            "authToken=" +
            token +
            "; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400",
        },
      }
    )

    return res
  } else {
    return new Response(JSON.stringify({ message: "Authentication failed" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

export async function GET(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("authToken="))
      ?.split("=")[1]

    if (!token) throw new Error("No token provided")

    const decoded = verify(token, process.env.JWT_SECRET as string)

    if (!decoded) {
      return new Response(JSON.stringify({ message: "Authorization failed" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      })
    } else {
      const res = new Response(
        JSON.stringify({ message: "Authorization successful" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      return res
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: "Authorization failed" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
