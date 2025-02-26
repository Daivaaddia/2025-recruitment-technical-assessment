import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: {
  recipes: recipe[];
  ingredients: ingredient[];
} = {
  recipes: [],
  ingredients: [],
};

// Task 1 helper (don't touch)
app.post("/parse", (req: Request, res: Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input);
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  const newName = recipeName
    .replace(/[-|_]+/g, " ")      // replace all - and _ characters as 1 whitespace
    .replace(/[^a-zA-Z\s]/g, "")  // remove everything that is not a letter or whitespace
    .trim()
    .toLowerCase();
  const splitName = newName.split(" ");
  // capitalise first letter of every word, then join as one string
  const finalName = splitName
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return finalName.length > 0 ? finalName : null;
};

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req: Request, res: Response) => {
  const { type } = req.body;

  if (!(type === "recipe" || type === "ingredient")) {
    res.status(400).send("entry type can only be recipe or ingredient");
    return;
  }

  const entryName = req.body.name;
  const recipeExists = cookbook.recipes.find(
    (entry) => entry.name === entryName
  );
  const ingredientExists = cookbook.ingredients.find(
    (entry) => entry.name === entryName
  );
  if (recipeExists || ingredientExists) {
    res.status(400).send("entry already exists in cookbook");
    return;
  }

  if (type === "recipe") {
    const recipe: recipe = {
      type: "recipe",
      name: entryName,
      requiredItems: req.body.requiredItems,
    };
    cookbook.recipes.push(recipe);
  } else {
    if (req.body.cookTime < 0) {
      res.status(400).send("cooktime can only be more than or equal to 0");
      return;
    }

    const ingredient: ingredient = {
      type: "ingredient",
      name: entryName,
      cookTime: req.body.cooktime,
    };
    cookbook.ingredients.push(ingredient);
  }

  res.status(200).json({});
  return;
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name

// helper function to go through recipes recursively. returns false if ingredient / recipe is missing, and true otherwise
const recurseRecipes = (
  recipe: recipe,
  ingredientsList: requiredItem[],
  cookTime: number
): boolean => {
  for (const item of recipe.requiredItems) {
    const requiredRecipe = cookbook.recipes.find(
      (entry) => entry.name === item.name
    );

    if (requiredRecipe) {
      if (!recurseRecipes(requiredRecipe, ingredientsList, cookTime)) {
        return false;
      }
    } else {
      // required item is an ingredient
      const requiredIngredient = cookbook.ingredients.find(
        (entry) => entry.name === item.name
      );
      if (!requiredIngredient) {
        return false;
      }

      const index = ingredientsList.findIndex(
        (ingredient) => ingredient.name === item.name
      );
      if (index !== -1) {
        ingredientsList[index].quantity += item.quantity;
      } else {
        ingredientsList.push(item);
      }

      cookTime += requiredIngredient.cookTime * item.quantity;
    }
  }

  return true;
};

app.get("/summary", (req: Request, res: Request) => {
  const cookbookEntry = cookbook.recipes.find(
    (recipe) => recipe.name === req.query.name
  );
  if (!cookbookEntry) {
    res.status(400).send("recipe not found");
    return;
  }

  const ingredientsList: requiredItem[] = [];
  const cookTime = 0;
  if (!recurseRecipes(cookbookEntry, ingredientsList, cookTime)) {
    res.status(400).send("missing required ingredient/recipe");
    return;
  }

  res.status(200).send({
    name: cookbookEntry.name,
    cookTime,
    ingredients: ingredientsList,
  });
  return;
});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
