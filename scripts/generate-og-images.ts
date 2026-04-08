import { main } from './og/main';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
