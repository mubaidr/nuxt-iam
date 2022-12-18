import { PrismaClient } from "@prisma/client";
import { userExists } from "./helpers";
import { UnregisteredUser, RegisteredUser, ApiResult } from "./types";
import { H3Event, H3Error } from "h3";

const prisma = new PrismaClient();

/**
 * @desc Updates a user
 * @param UnregUser Unregistered user with properties e.g first_name, email
 */
export async function updateUser(event: H3Event): Promise<ApiResult | H3Error> {
  const body = await readBody(event);
  const { fromRoute } = event.context.params;
  let registeredUser = {} as RegisteredUser;

  // If no uuid given
  if (!fromRoute.uuid)
    throw createError({
      statusCode: 400,
      statusMessage: "Uuid not supplied",
    });

  // If uuid exists, but user does not exist
  if (!(await userExists(fromRoute.uuid)))
    throw createError({
      statusCode: 400,
      statusMessage: "User not found",
    });

  // If first name and last name do not exist in body
  if ("first_name" in body === false && "last_name" in body === false)
    return createError({
      statusCode: 400,
      statusMessage: "No updatable properties supplied",
    });

  // If first_name empty
  if (!body.first_name)
    return createError({
      statusCode: 400,
      statusMessage: "first_name must have data",
    });

  // If last_name empty
  if (!body.last_name)
    return createError({
      statusCode: 400,
      statusMessage: "last_name must have data",
    });

  await prisma.user
    .update({
      where: {
        uuid: fromRoute.uuid,
      },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
      },
    })
    .then(async (result) => {
      registeredUser = result;
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });

  // Create api result
  const result = {} as ApiResult;
  result.success = true;
  result.data = { email: registeredUser.email };

  return result;
}
