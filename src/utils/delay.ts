/**
 * Delay
 *
 * @param {number} time delay in milliseconds
 *
 * @returns {IS3} S3 instance
 */
export default async function delay(time: number): Promise<object> {
    return new Promise((resolve) => setTimeout(resolve, time));
}
