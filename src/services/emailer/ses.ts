import * as AWS_SES from "@aws-sdk/client-ses";
import {
  SESv2Client,
  SendEmailCommand as SendEmailCommandV2,
} from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";

const { SES } = AWS_SES;

import { Attachment } from "nodemailer/lib/mailer";
import config from "../../settings/config";
import { chunkArray } from "../../util/arrayUtils";
import { BASIC_TEMPLATE_DATA, TEmailSource } from "./utils";

const sesAws = new SES({
  apiVersion: "2010-12-01",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_ACCESS_KEY_SECRET,
  },
  region: config.AWS_ACCESS_REGION,
});

const sesv2Client = new SESv2Client({
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_ACCESS_KEY_SECRET,
  },
  region: config.AWS_ACCESS_REGION,
});

const getSourceEmail = (emailFrom: TEmailSource) => {
  return emailFrom === "no_reply"
    ? `Job Portal <${config.EMAIL_NO_REPLY}>`
    : `Job Portal <${config.EMAIL_MAIN}>`;
};

// create a template
export const createEmailTemplate = async (
  templateName: string,
  subject: string,
  templateHTML?: string,
  templateText?: string,
) => {
  const template = await sesAws.createTemplate({
    Template: {
      TemplateName: templateName,
      SubjectPart: subject,
      HtmlPart: templateHTML,
      TextPart: templateText,
    },
  });

  return template;
};

// update a template
export const updateEmailTemplate = async (
  templateName: string,
  subject: string,
  templateHTML?: string,
  templateText?: string,
) => {
  const template = await sesAws.updateTemplate({
    Template: {
      TemplateName: templateName,
      SubjectPart: subject,
      HtmlPart: templateHTML,
      TextPart: templateText,
    },
  });

  return template;
};

// delete a template
export const deleteEmailTemplate = async (templateName: string) => {
  const template = await sesAws.deleteTemplate({
    TemplateName: templateName,
  });

  return template;
};

// send email
export const sendEmail = async (
  emailSource: TEmailSource,
  emailDestination: string,
  subject: string,
  bodyHtml?: string,
  bodyText?: string,
) => {
  // build body
  const body: AWS_SES.Body = {};
  if (bodyHtml) {
    body.Html = {
      Charset: "UTF-8",
      Data: bodyHtml || "",
    };
  }
  if (bodyText) {
    body.Text = {
      Charset: "UTF-8",
      Data: bodyText || "",
    };
  }
  const response = await sesAws.sendEmail({
    Destination: {
      ToAddresses: [emailDestination],
    },
    Source: getSourceEmail(emailSource),
    Message: {
      Body: body,
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
  });

  return response;
};

export const sendEmailViaNodemailer = (
  emailSource: TEmailSource,
  subject: string,
  html: string,
  toAddresses: string[],
  attachments?: Attachment[],
) => {
  const transporter = nodemailer.createTransport({
    SES: { sesClient: sesv2Client, SendEmailCommand: SendEmailCommandV2 },
  });
  const mailOptions = {
    from: getSourceEmail(emailSource),
    subject,
    html,
    to: toAddresses,
    attachments,
  };

  transporter.sendMail(mailOptions);
};

// send a templated email
export const sendTemplatedEmail = async (
  emailSource: TEmailSource,
  emailDestinations: string[],
  templateName: string,
  templateData?: Record<string, any>,
) => {
  const response = await sesAws.sendTemplatedEmail({
    Destination: {
      /* required */
      CcAddresses: [],
      ToAddresses: emailDestinations,
    },
    Source: getSourceEmail(emailSource),
    Template: templateName /* required */,
    TemplateData: JSON.stringify(templateData || {}) /* required */,
  });

  return response;
};

const BULK_SUBSCRIBER_SIZE = 50;

// template bulk
export const sendBulkTemplatedEmail = async (
  emailSource: TEmailSource,
  emailDestinations: {
    emailDestination: string;
    templateData?: Record<string, any>;
  }[],
  templateName: string,
) => {
  const emailDestinationsChunked: {
    emailDestination: string;
    templateData?: Record<string, any>;
  }[][] = chunkArray(emailDestinations, BULK_SUBSCRIBER_SIZE);

  const awsPublishingIds: string[] = [];

  emailDestinationsChunked.forEach(async (emailDestinations) => {
    const response = await sesAws.sendBulkTemplatedEmail({
      Source: getSourceEmail(emailSource),
      Destinations: emailDestinations.map((e) => ({
        Destination: {
          ToAddresses: [e.emailDestination],
        },
        ReplacementTemplateData: JSON.stringify(e.templateData || {}),
      })),
      Template: templateName /* required */,
      DefaultTemplateData: JSON.stringify(BASIC_TEMPLATE_DATA() || {}),
    });

    if (response.$metadata.requestId) {
      awsPublishingIds.push(response.$metadata.requestId);
    }
  });

  return awsPublishingIds;
};
