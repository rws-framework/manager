import { RWSWebpackBuilder } from "./RWSWebpackBuilder";
import { RWSServiceWorkerBuilder } from "./RWSServiceWorkerBuilder";

export default {
    webpack: RWSWebpackBuilder,
    sw: RWSServiceWorkerBuilder
}