

import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Injectable } from "@nestjs/common";
import { z } from "zod";

@Injectable()
export class OutputParserService {
  /**
   * Parser for SuperAgent, which routes customer messages to specialized agents.
   * AI Guidance:
   * - Output an array of objects, each specifying an agent and the message part it should handle.
   * - Use 'agent' to select from: MessageAgent, ProductAgent, AskAgent, OrderAgent, AdminMessageAgent.
   * - 'messageToAgent' guides the selected agent on how to process the customer message.
   * - 'customerMessage' is the original or split portion of the customer’s message.
   * - Provide clear reasoning in 'callingAgentThought' and 'messageToAgentThought'.
   * - For multi-intent messages, split into multiple objects (e.g., greeting + product query).
   * - If intent is unclear, route to AdminMessageAgent with a note.
   */
  getSuperAgentOutputParser() {
    return StructuredOutputParser.fromZodSchema(z.array(z.object({
      agent_name: z.string().describe("The name of the agent to call. Can be one of general_message_agent, product_suggestion_agent, payment_agent, order_taking_agent"),
      reason: z.string().describe("The reason why this agent is being called."),
      customerMessage: z.string().describe("message from customer if multiple divide it to multiple agent"),
    })));
  }

  /**
   * Parser for MessageAgent, which handles greetings and polite messages.
   * AI Guidance:
   * - Output an array with one object (multiple for batched messages).
   * - Set 'responded: true' for in-scope messages (e.g., 'Hi!', 'Thanks!').
   * - Set 'responded: false' for out-of-scope messages (e.g., product queries) with an empty 'message'.
   * - 'message' should be a friendly response with a product redirect if responded: true.
   * - 'thought' explains the decision and response logic.
   * - 'confidence' is 0.8–1.0 for clear greetings, 0.5–0.7 for vague, 0.0–0.4 for out-of-scope.
   * - 'priority' is typically 1; adjust only if multiple agents respond simultaneously.
   */
  getMessageOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.array(
        z.object({

          message: z
            .string()
            .describe(
              "Response message to customer"
            ),
          thought: z
            .string()
            .describe(
              "Explanation of why the agent responded or not (e.g., 'Clear greeting' or 'Product query, out-of-scope')"
            ),
          confidence: z
            .number()
            .min(0)
            .max(1)
            .describe(
              "Confidence in the response decision (0.8–1.0 for clear, 0.5–0.7 for vague, 0.0–0.4 for out-of-scope)"
            ),

        })
      ).describe("Array of MessageAgent responses for polite or emotional messages")
    );
  }



  getProductAgentOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.object({
        thought: z.string().describe("Reasoning for the response (e.g., 'Clear query about T-shirt' or 'Product unavailable')"),
        confidence: z.number().min(0).max(1).describe("Confidence in the response accuracy (0.8–1.0 for clear, 0.5–0.7 for ambiguous, 0.0–0.4 for out-of-scope)"),
          response_type:z.string().describe("suggestion or question"),
          suggestion:z.object({
            images:z.array(
              z.object({
                imageUrl: z.string().describe("URL of the product image from product list"),
                about_image: z.string().describe("Product details: name, size, price (NPR), quantity available, short description from product list"),
              })).describe("Array of product images and details; empty if no images available"),
            message: z.string().describe("Message to the customer after product sent"),
          }), 
          question:z.string().describe("asking question to the customer"),
      }).describe("ProductAgent response for product-related queries")
    );
  }


  /**
   * Parser for OrderAgent, which saves complete orders.
   * AI Guidance:
   * - Output a single object with an 'orders' array.
   * - Each order includes 'productId', 'name', 'quantity', and 'size' from verified product data.
   * - Only include complete orders (all details provided and confirmed).
   * - Set 'orders' to empty array if details are missing or unconfirmed.
   * - 'quantity' and 'size' are nullable only if explicitly unconfirmed in the latest message.
   * - Use 'productId' and 'name' exactly as provided in product data.
   */
  getOrderAgentOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.object({  
        orders: z.array(
            z.object({
              productId: z.string().describe("Unique identifier of the product from the product data"),
              name: z.string().describe("Name of the product being ordered (e.g., 'Blue T-shirt')"),
              quantity: z.number().nullable().describe("Number of units ordered; null only if unconfirmed in latest message"),
              size: z.string().nullable().describe("Size of the product (e.g., 'XS', 'S', 'M', 'L', 'XL'); null only if unconfirmed or not applicable"),
            })
          ).describe("Array of complete orders; empty if details are missing or unconfirmed"),
      }).describe("OrderAgent output for saving complete orders")
    );
  }
}
