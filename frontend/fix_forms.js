const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Restore generic useForm if it was removed
  const match = content.match(/const form = useForm\(\{/);
  if (match) {
    // Find schema name from zodResolver
    const schemaMatch = content.match(/resolver: zodResolver\(([a-zA-Z0-9_]+)\)/);
    if (schemaMatch) {
      const schemaName = schemaMatch[1];
      const typeNameMatch = content.match(new RegExp(`type ([a-zA-Z0-9_]+) = z\\.infer<typeof ${schemaName}>`));
      if (typeNameMatch) {
        const typeName = typeNameMatch[1];
        content = content.replace(/const form = useForm\(\{/, `const form = useForm<${typeName}>({`);
      }
    }
  }

  // Add `as any` to zodResolver if missing
  content = content.replace(/resolver: zodResolver\(([a-zA-Z0-9_]+)\),/, 'resolver: zodResolver($1) as any,');
  
  fs.writeFileSync(file, content);
}
